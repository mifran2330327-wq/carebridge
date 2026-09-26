import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const RESOURCE_TYPES = ['ARTICLE', 'CASE_STUDY', 'VIDEO', 'GUIDE', 'DOWNLOADABLE']
const DEFAULT_PAGE_SIZE = 20

function parsePagination(query) {
  const take = Math.min(Math.max(parseInt(query.take || '20', 10), 1), 100)
  const skip = Math.max(parseInt(query.skip || '0', 10), 0)
  return { take, skip }
}

function youtubeId(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v') || parsed.pathname.split('/').pop()
  } catch {}
  return null
}

async function enrichVideo(data = {}) {
  const safeData = data || {}
  const id = safeData.type === 'VIDEO' && safeData.externalUrl ? youtubeId(safeData.externalUrl) : null
  if (!id) return safeData
  try {
    const result = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(safeData.externalUrl)}&format=json`)
    if (result.ok) {
      const metadata = await result.json()
      return { ...safeData, title: safeData.title?.trim() || metadata.title, sourceName: safeData.sourceName?.trim() || metadata.author_name, thumbnailUrl: safeData.thumbnailUrl || metadata.thumbnail_url }
    }
  } catch (error) { console.warn('YouTube metadata lookup failed:', error.message) }
  return { ...safeData, thumbnailUrl: safeData.thumbnailUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
}

function publicInclude() {
  return { specialties: { include: { specialty: true } }, author: { select: { name: true, professionType: true } } }
}

router.get('/', async (request, response) => {
  try {
    const { type, specialty, featured, take, skip } = { ...parsePagination(request.query), type: request.query.type, specialty: request.query.specialty, featured: request.query.featured }
    const where = { status: 'PUBLISHED', ...(type && RESOURCE_TYPES.includes(type) ? { type } : {}), ...(featured === 'true' ? { featured: true } : {}), ...(specialty ? { specialties: { some: { specialty: { name: { contains: specialty, mode: 'insensitive' } } } } } : {}) }
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: publicInclude(),
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
      }),
      prisma.resource.count({ where }),
    ])
    response.json({ resources, pagination: { total, take, skip } })
  } catch (error) {
    console.error('Failed to get resources:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch resources' })
  }
})

router.get('/mine', requireAuth, async (request, response) => {
  if (request.user.role !== 'DOCTOR') return response.status(403).json({ error: 'Professional access required' })
  try {
    const professional = await prisma.professional.findUnique({ where: { ownerId: request.user.userId } })
    const resources = professional ? await prisma.resource.findMany({ where: { authorId: professional.id }, include: publicInclude(), orderBy: { createdAt: 'desc' } }) : []
    response.json({ resources })
  } catch (error) {
    console.error('Failed to get my resources:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch your resources' })
  }
})

router.post('/', requireAuth, async (request, response) => {
  if (!['DOCTOR', 'ADMIN'].includes(request.user.role)) return response.status(403).json({ error: 'Only doctors and admins can create resources' })
  try {
    const { type, title, summary, externalUrl, sourceName, thumbnailUrl, featured = false, specialties = [] } = await enrichVideo(request.body)
    if (!RESOURCE_TYPES.includes(type)) return response.status(400).json({ error: 'Choose a valid resource type' })
    if (!title?.trim()) return response.status(400).json({ error: 'Title is required' })
    if ((type === 'VIDEO' || type === 'CASE_STUDY') && !externalUrl?.trim()) return response.status(400).json({ error: 'URL is required for videos and case studies' })
    // Summary required only for non-admin article submissions
    if (request.user.role !== 'ADMIN' && type === 'ARTICLE' && !summary?.trim()) return response.status(400).json({ error: 'A summary is required for articles' })
    const professional = request.user.role === 'DOCTOR' ? await prisma.professional.findUnique({ where: { ownerId: request.user.userId } }) : null
    const resource = await prisma.resource.create({ data: {
      type, title: title.trim(), summary: summary?.trim() || title.trim(), externalUrl: externalUrl?.trim() || null, sourceName: sourceName?.trim() || null, thumbnailUrl: thumbnailUrl || null,
      featured: request.user.role === 'ADMIN' ? Boolean(featured) : false, status: request.user.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING', publishedAt: request.user.role === 'ADMIN' ? new Date() : null,
      authorId: professional?.id || null, createdById: request.user.userId,
      specialties: { create: specialties.map((name) => ({ specialty: { connectOrCreate: { where: { name: name.trim() }, create: { name: name.trim(), isCustom: true } } } })) },
    }, include: publicInclude() })
    response.status(201).json({ resource })
  } catch (error) {
    console.error('Failed to create resource:', error)
    response.status(500).json({ error: error.message || 'Unable to submit resource' })
  }
})

router.patch('/:id', requireAuth, async (request, response) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: request.params.id }, include: { author: true } })
    if (!resource) return response.status(404).json({ error: 'Resource not found' })
    const isAdmin = request.user.role === 'ADMIN'
    const isAuthor = resource.author?.ownerId === request.user.userId
    if (!isAdmin && (!isAuthor || resource.status !== 'PENDING')) return response.status(403).json({ error: 'You can only edit your own pending resource' })
    const { title, summary, externalUrl, sourceName, thumbnailUrl, type, specialties = [] } = await enrichVideo(request.body)
    await prisma.resourceSpecialty.deleteMany({ where: { resourceId: resource.id } })
    const updated = await prisma.resource.update({ where: { id: resource.id }, data: {
      ...(title !== undefined ? { title: title.trim() } : {}), ...(summary !== undefined ? { summary: summary.trim() } : {}), ...(externalUrl !== undefined ? { externalUrl: externalUrl?.trim() || null } : {}), ...(sourceName !== undefined ? { sourceName: sourceName?.trim() || null } : {}), ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl || null } : {}), ...(type && RESOURCE_TYPES.includes(type) ? { type } : {}),
      ...(isAdmin && request.body.status ? { status: request.body.status, publishedAt: request.body.status === 'PUBLISHED' ? new Date() : null } : {}), ...(isAdmin && request.body.featured !== undefined ? { featured: Boolean(request.body.featured) } : {}),
      specialties: { create: specialties.map((name) => ({ specialty: { connectOrCreate: { where: { name: name.trim() }, create: { name: name.trim(), isCustom: true } } } })) },
    }, include: publicInclude() })
    response.json({ resource: updated })
  } catch (error) {
    console.error('Failed to update resource:', error)
    response.status(500).json({ error: error.message || 'Unable to update resource' })
  }
})

router.delete('/:id', requireAuth, async (request, response) => {
  if (request.user.role !== 'ADMIN') return response.status(403).json({ error: 'Admin access required' })
  try {
    await prisma.resource.delete({ where: { id: request.params.id } })
    response.status(204).end()
  } catch (error) {
    console.error('Failed to delete resource:', error)
    response.status(500).json({ error: error.message || 'Unable to delete resource' })
  }
})

export default router
