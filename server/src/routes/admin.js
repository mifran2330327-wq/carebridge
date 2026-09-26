import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { isAdmin } from '../middleware/admin.js'
import { createNotification } from '../lib/notification.js'

const router = Router()
router.use(isAdmin)

const DEFAULT_PAGE_SIZE = 20
const VALID_RESOURCE_TYPES = ['VIDEO', 'ARTICLE', 'GUIDE', 'DOWNLOADABLE', 'CASE_STUDY']

function parsePagination(query) {
  const take = Math.min(Math.max(parseInt(query.take || '20', 10), 1), 100)
  const skip = Math.max(parseInt(query.skip || '0', 10), 0)
  return { take, skip }
}

function youtubeThumbnail(url) {
  try {
    const parsed = new URL(url)
    let id = null
    if (parsed.hostname === 'youtu.be') id = parsed.pathname.slice(1)
    if (parsed.hostname.includes('youtube.com')) id = parsed.searchParams.get('v') || parsed.pathname.split('/').pop()
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  } catch {}
  return null
}

router.get('/doctors/pending', async (request, response) => {
  const { take, skip } = parsePagination(request.query)
  const [doctors, total] = await Promise.all([
    prisma.professional.findMany({ where: { verificationStatus: 'PENDING' }, include: { degrees: { include: { degree: true } }, specialties: { include: { specialty: true } }, certificates: true, owner: { select: { email: true, name: true } } }, orderBy: { createdAt: 'asc' }, take, skip }),
    prisma.professional.count({ where: { verificationStatus: 'PENDING' } }),
  ])
  response.json({ doctors, pagination: { total, take, skip } })
})

router.patch('/doctors/:id/verify', async (request, response) => {
  try {
    const { status, note } = request.body || {}
    if (!['VERIFIED', 'REJECTED'].includes(status)) return response.status(400).json({ error: 'Status must be VERIFIED or REJECTED' })
    const doctor = await prisma.professional.update({
      where: { id: request.params.id },
      data: { verificationStatus: status, verificationNote: note?.trim() || null },
      include: { owner: { select: { id: true, name: true } } },
    })

    if (doctor.ownerId) {
      const reasonText = note ? `Reason: ${note}` : ''
      await createNotification({
        userId: doctor.ownerId,
        type: status === 'VERIFIED' ? 'DOCTOR_VERIFIED' : 'DOCTOR_REJECTED',
        message: status === 'VERIFIED'
          ? 'Your professional profile has been verified!'
          : `Your professional profile verification was rejected. ${reasonText}`,
        link: '/dashboard',
      })
    }

    response.json({ doctor })
  } catch (error) {
    console.error('Doctor verification failed:', error)
    response.status(500).json({ error: error.message || 'Failed to verify doctor' })
  }
})

router.get('/users', async (request, response) => {
  const { take, skip } = parsePagination(request.query)
  const query = String(request.query.q || '').trim()
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where: query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }] } : undefined, select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.user.count({ where: query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }] } : undefined }),
  ])
  response.json({ users, pagination: { total, take, skip } })
})

router.patch('/users/:id/ban', async (request, response) => {
  try {
    const user = await prisma.user.update({ where: { id: request.params.id }, data: { isBanned: request.body.banned !== false } })
    response.json({ user: { id: user.id, isBanned: user.isBanned } })
  } catch (error) {
    console.error('User ban status update failed:', error)
    response.status(500).json({ error: error.message || 'Failed to update user ban status' })
  }
})

router.delete('/users/:id', async (request, response) => {
  try {
    if (request.params.id === request.user.userId) return response.status(400).json({ error: 'You cannot delete your own account' })
    const target = await prisma.user.findUnique({ where: { id: request.params.id }, select: { role: true } })
    if (!target) return response.status(404).json({ error: 'User not found' })
    if (target.role === 'ADMIN' && await prisma.user.count({ where: { role: 'ADMIN' } }) <= 1) return response.status(400).json({ error: 'The last admin cannot be deleted' })
    await prisma.$transaction(async (transaction) => {
      await transaction.appointment.deleteMany({ where: { OR: [{ parentId: request.params.id }, { professional: { ownerId: request.params.id } }] } })
      await transaction.user.delete({ where: { id: request.params.id } })
    })
    response.status(204).end()
  } catch (error) {
    console.error('User deletion failed:', error)
    response.status(500).json({ error: error.message || 'Failed to delete user' })
  }
})

router.post('/institutions', async (request, response) => {
  try {
    const { name, type, ownership, address, district, website, latitude, longitude } = request.body || {}
    if (!name?.trim()) return response.status(400).json({ error: 'Institution name is required' })
    const institution = await prisma.institution.create({
      data: {
        name: name.trim(),
        type: type || 'SCHOOL',
        ownership: ownership || 'PRIVATE',
        address: address?.trim() || null,
        district: district?.trim() || null,
        website: website?.trim() || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        verificationStatus: 'VERIFIED',
      },
    })
    response.status(201).json({ institution })
  } catch (error) {
    console.error('Institution creation failed:', error)
    response.status(500).json({ error: error.message || 'Failed to create institution' })
  }
})

router.patch('/institutions/:id', async (request, response) => {
  try {
    const institution = await prisma.institution.update({ where: { id: request.params.id }, data: request.body })
    response.json({ institution })
  } catch (error) {
    console.error('Institution update failed:', error)
    response.status(500).json({ error: error.message || 'Failed to update institution' })
  }
})

router.delete('/institutions/:id', async (request, response) => {
  try {
    await prisma.institution.delete({ where: { id: request.params.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Institution deletion failed:', error)
    response.status(500).json({ error: error.message || 'Failed to delete institution' })
  }
})

router.post('/resources', async (request, response) => {
  try {
    const { title, summary, type, externalUrl, sourceName, specialties = [], featured = false } = request.body || {}
    if (!title?.trim() || !type) return response.status(400).json({ error: 'Title and type are required' })
    if (!VALID_RESOURCE_TYPES.includes(type)) {
      return response.status(400).json({ error: `Invalid type. Allowed: ${VALID_RESOURCE_TYPES.join(', ')}` })
    }

    const thumb = (type === 'VIDEO' && externalUrl) ? youtubeThumbnail(externalUrl) : null

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        summary: summary?.trim() || title.trim(),
        type,
        externalUrl: externalUrl?.trim() || null,
        sourceName: sourceName?.trim() || null,
        thumbnailUrl: thumb,
        featured: Boolean(featured),
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdById: request.user.userId,
      },
    })

    // Link specialties if provided
    if (specialties.length > 0) {
      await prisma.resourceSpecialty.createMany({
        data: specialties.map((specialtyId) => ({ resourceId: resource.id, specialtyId })),
        skipDuplicates: true,
      })
    }

    response.status(201).json({ resource })
  } catch (error) {
    console.error('Resource creation failed:', error)
    response.status(500).json({ error: error.message || 'Failed to publish resource' })
  }
})

router.get('/resources/pending', async (request, response) => {
  const { take, skip } = parsePagination(request.query)
  const [resources, total] = await Promise.all([
    prisma.resource.findMany({ where: { status: 'PENDING' }, include: { author: { select: { name: true, professionType: true } }, specialties: { include: { specialty: true } } }, orderBy: { createdAt: 'asc' }, take, skip }),
    prisma.resource.count({ where: { status: 'PENDING' } }),
  ])
  response.json({ resources, pagination: { total, take, skip } })
})

router.patch('/resources/:id', async (request, response) => {
  try {
    const resource = await prisma.resource.update({
      where: { id: request.params.id },
      data: { status: request.body.status, featured: request.body.featured, publishedAt: request.body.status === 'PUBLISHED' ? new Date() : null },
      include: { createdBy: { select: { id: true } } },
    })
    response.json({ resource })

    if (resource.createdById && request.body.status) {
      await createNotification({
        userId: resource.createdById,
        type: request.body.status === 'PUBLISHED' ? 'RESOURCE_PUBLISHED' : 'RESOURCE_REJECTED',
        message: request.body.status === 'PUBLISHED'
          ? 'Your resource has been published!'
          : 'Your resource submission was rejected.',
        link: '/resources',
      })
    }
  } catch (error) {
    console.error('Resource status update failed:', error)
    response.status(500).json({ error: error.message || 'Failed to update resource' })
  }
})

router.delete('/resources/:id', async (request, response) => {
  try {
    await prisma.resource.delete({ where: { id: request.params.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Resource deletion failed:', error)
    response.status(500).json({ error: error.message || 'Failed to delete resource' })
  }
})

// Community reports
router.get('/reports', async (request, response) => {
  const { take, skip } = parsePagination(request.query)
  const { status } = request.query
  const where = status ? { status } : {}
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        post: { select: { id: true, title: true, authorId: true, author: { select: { name: true } } } },
        comment: { select: { id: true, body: true, authorId: true, author: { select: { name: true } }, postId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.report.count({ where }),
  ])
  response.json({ reports, pagination: { total, take, skip } })
})

router.patch('/reports/:id', async (request, response) => {
  try {
    const { action, postStatus } = request.body // action: 'resolve' | 'dismiss', postStatus: 'HIDDEN' (for resolve)
    const report = await prisma.report.findUnique({
      where: { id: request.params.id },
      include: { post: true, comment: true },
    })
    if (!report) return response.status(404).json({ error: 'Report not found' })

    if (action === 'resolve') {
      if (report.postId) {
        await prisma.communityPost.update({ where: { id: report.postId }, data: { status: postStatus || 'HIDDEN' } })
        // Notify post author
        const post = await prisma.communityPost.findUnique({ where: { id: report.postId }, select: { authorId: true, title: true } })
        if (post) {
          await prisma.notification.create({
            data: { userId: post.authorId, type: 'COMMUNITY_POST_HIDDEN', message: `Your post "${post.title}" was hidden by moderation`, link: `/community/${post.id}` },
          })
        }
      }
      if (report.commentId) {
        await prisma.comment.delete({ where: { id: report.commentId } })
        // Notify comment author
        const comment = await prisma.comment.findUnique({ where: { id: report.commentId }, select: { authorId: true, postId: true } })
        if (comment) {
          const post = await prisma.communityPost.findUnique({ where: { id: comment.postId }, select: { title: true } })
          await prisma.notification.create({
            data: { userId: comment.authorId, type: 'COMMUNITY_COMMENT_REMOVED', message: `Your comment on "${post?.title}" was removed by moderation`, link: `/community/${post?.id}` },
          })
        }
      }
    }
    await prisma.report.delete({ where: { id: report.id } })
    response.json({ ok: true })
  } catch (error) {
    console.error('Report resolution failed:', error)
    response.status(500).json({ error: error.message || 'Failed to update report' })
  }
})

router.get('/admins', async (_request, response) => {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true, email: true, createdAt: true } })
  response.json({ admins })
})

router.post('/admins/promote/:userId', async (request, response) => {
  try {
    const actor = await prisma.user.findUnique({ where: { id: request.user.userId } })
    if (!actor || !(await bcrypt.compare(request.body.adminPassword || '', actor.passwordHash))) return response.status(403).json({ error: 'Current admin password is incorrect' })
    const user = await prisma.user.update({ where: { id: request.params.userId }, data: { role: 'ADMIN' } })
    response.json({ user: { id: user.id, role: user.role } })
  } catch (error) {
    console.error('Admin promotion failed:', error)
    response.status(500).json({ error: error.message || 'Failed to promote admin' })
  }
})

router.post('/admins/create', async (request, response) => {
  try {
    const actor = await prisma.user.findUnique({ where: { id: request.user.userId } })
    if (!actor || !(await bcrypt.compare(request.body.adminPassword || '', actor.passwordHash))) return response.status(403).json({ error: 'Current admin password is incorrect' })
    if (!request.body.name || !request.body.email || !request.body.password) return response.status(400).json({ error: 'Name, email, and temporary password are required' })
    const user = await prisma.user.create({ data: { name: request.body.name.trim(), email: request.body.email.trim().toLowerCase(), passwordHash: await bcrypt.hash(request.body.password, 12), role: 'ADMIN', mustChangePassword: true } })
    response.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error('Admin creation failed:', error)
    response.status(500).json({ error: error.message || 'Failed to create admin' })
  }
})

router.delete('/admins/:id', async (request, response) => {
  try {
    const actor = await prisma.user.findUnique({ where: { id: request.user.userId } })
    if (!actor || !(await bcrypt.compare(request.body.adminPassword || '', actor.passwordHash))) return response.status(403).json({ error: 'Current admin password is incorrect' })
    if (await prisma.user.count({ where: { role: 'ADMIN' } }) <= 1) return response.status(400).json({ error: 'The last admin cannot be deleted' })
    await prisma.user.delete({ where: { id: request.params.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Admin deletion failed:', error)
    response.status(500).json({ error: error.message || 'Failed to delete admin' })
  }
})

export default router
