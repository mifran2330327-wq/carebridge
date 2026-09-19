import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_request, response) => {
  const [institutions, professionals] = await Promise.all([
    prisma.institution.findMany({ orderBy: { name: 'asc' } }),
    prisma.professional.findMany({ include: { institution: true, degrees: { include: { degree: true } }, specialties: { include: { specialty: true } } }, orderBy: { name: 'asc' } }),
  ])
  response.json({ institutions, professionals })
})

router.get('/resources', async (_request, response) => {
  const resources = await prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } })
  response.json({ resources })
})

function requireAdmin(request, response, next) {
  if (request.user?.role !== 'ADMIN') return response.status(403).json({ error: 'Admin access required' })
  next()
}

router.use(requireAuth, requireAdmin)

router.get('/pending', async (_request, response) => {
  const [professionals, institutions] = await Promise.all([
    prisma.professional.findMany({ where: { verificationStatus: 'PENDING' }, include: { institution: true } }),
    prisma.institution.findMany({ where: { verificationStatus: 'PENDING' } }),
  ])
  response.json({ professionals, institutions })
})

router.patch('/professionals/:id/verify', async (request, response) => {
  const { status } = request.body
  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) return response.status(400).json({ error: 'Invalid verification status' })
  const professional = await prisma.professional.update({ where: { id: request.params.id }, data: { verificationStatus: status } })
  response.json({ professional })
})

router.patch('/institutions/:id/verify', async (request, response) => {
  const { status } = request.body
  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) return response.status(400).json({ error: 'Invalid verification status' })
  const institution = await prisma.institution.update({ where: { id: request.params.id }, data: { verificationStatus: status } })
  response.json({ institution })
})

router.post('/institutions', async (request, response) => {
  const { name, type, ownership, address, district, website, latitude, longitude } = request.body
  if (!name?.trim()) return response.status(400).json({ error: 'Institution name is required' })
  const institution = await prisma.institution.create({ data: {
    name: name.trim(), type: type?.trim() || undefined, ownership: ownership?.trim() || undefined,
    address: address?.trim() || undefined, district: district?.trim() || undefined,
    website: website?.trim() || undefined, latitude: Number(latitude) || undefined, longitude: Number(longitude) || undefined,
    verificationStatus: 'PENDING',
  } })
  response.status(201).json({ institution })
})

export default router
