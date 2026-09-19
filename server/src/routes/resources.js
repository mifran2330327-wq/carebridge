import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const RESOURCE_TYPES = ['ARTICLE', 'CASE_STUDY', 'VIDEO', 'GUIDE', 'DOWNLOADABLE']

function youtubeId(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v') || parsed.pathname.split('/').pop()
  } catch {}
  return null
}

async function enrichVideo(data) {
  const id = data.type === 'VIDEO' && data.externalUrl ? youtubeId(data.externalUrl) : null
  if (!id) return data
  try {
    const result = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(data.externalUrl)}&format=json`)
    if (result.ok) {
      const metadata = await result.json()
      return { ...data, title: data.title?.trim() || metadata.title, sourceName: data.sourceName?.trim() || metadata.author_name, thumbnailUrl: data.thumbnailUrl || metadata.thumbnail_url }
    }
  } catch (error) { console.warn('YouTube metadata lookup failed:', error.message) }
  return { ...data, thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
}

function publicInclude() {
  return { specialties: { include: { specialty: true } }, author: { select: { name: true, professionType: true } } }
}

router.get('/', async (request, response) => {
  const { type, specialty, featured } = request.query
  const resources = await prisma.resource.findMany({
    where: { status: 'PUBLISHED', ...(type && RESOURCE_TYPES.includes(type) ? { type } : {}), ...(featured === 'true' ? { featured: true } : {}), ...(specialty ? { specialties: { some: { specialty: { name: { contains: specialty, mode: 'insensitive' } } } } } : {}) },
    include: publicInclude(), orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
  })
  response.json({ resources })
})

router.get('/mine', requireAuth, async (request, response) => {
  if (request.user.role !== 'DOCTOR') return response.status(403).json({ error: 'Professional access required' })
  const professional = await prisma.professional.findUnique({ where: { ownerId: request.user.userId } })
  const resources = professional ? await prisma.resource.findMany({ where: { authorId: professional.id }, include: publicInclude(), orderBy: { createdAt: 'desc' } }) : []
  response.json({ resources })
})

router.post('/', requireAuth, async (request, response) => {
  if (!['DOCTOR', 'ADMIN'].includes(request.user.role)) return response.status(403).json({ error: 'Only doctors and admins can create resources' })
  const { type, title, summary, externalUrl, sourceName, thumbnailUrl, featured = false, specialties = [] } = await enrichVideo(request.body)
  if (!RESOURCE_TYPES.includes(type)) return response.status(400).json({ error: 'Choose a valid resource type' })
  if (!summary?.trim()) return response.status(400).json({ error: 'A summary or article body is required' })
  if (!title?.trim() || ((type === 'VIDEO' || type === 'CASE_STUDY') && !externalUrl?.trim())) return response.status(400).json({ error: 'Title and the required external URL are needed' })
  const professional = request.user.role === 'DOCTOR' ? await prisma.professional.findUnique({ where: { ownerId: request.user.userId } }) : null
  const resource = await prisma.resource.create({ data: {
    type, title: title.trim(), summary: summary.trim(), externalUrl: externalUrl?.trim() || null, sourceName: sourceName?.trim() || null, thumbnailUrl: thumbnailUrl || null,
    featured: request.user.role === 'ADMIN' ? Boolean(featured) : false, status: request.user.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING', publishedAt: request.user.role === 'ADMIN' ? new Date() : null,
    authorId: professional?.id || null, createdById: request.user.userId,
    specialties: { create: specialties.map((name) => ({ specialty: { connectOrCreate: { where: { name: name.trim() }, create: { name: name.trim(), isCustom: true } } } })) },
  }, include: publicInclude() })
  response.status(201).json({ resource })
})

router.patch('/:id', requireAuth, async (request, response) => {
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
})

router.delete('/:id', requireAuth, async (request, response) => {
  if (request.user.role !== 'ADMIN') return response.status(403).json({ error: 'Admin access required' })
  await prisma.resource.delete({ where: { id: request.params.id } })
  response.status(204).end()
})

export default router
