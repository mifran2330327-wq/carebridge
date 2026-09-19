import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { isAdmin } from '../middleware/admin.js'

const router = Router()
router.use(isAdmin)

router.get('/doctors/pending', async (_request, response) => {
  const doctors = await prisma.professional.findMany({ where: { verificationStatus: 'PENDING' }, include: { degrees: { include: { degree: true } }, specialties: { include: { specialty: true } }, certificates: true, owner: { select: { email: true, name: true } } }, orderBy: { createdAt: 'asc' } })
  response.json({ doctors })
})

router.patch('/doctors/:id/verify', async (request, response) => {
  const { status, note } = request.body
  if (!['VERIFIED', 'REJECTED'].includes(status)) return response.status(400).json({ error: 'Status must be VERIFIED or REJECTED' })
  const doctor = await prisma.professional.update({ where: { id: request.params.id }, data: { verificationStatus: status, verificationNote: note?.trim() || null } })
  response.json({ doctor })
})

router.get('/users', async (request, response) => {
  const query = String(request.query.q || '').trim()
  const users = await prisma.user.findMany({ where: query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }] } : undefined, select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true }, orderBy: { createdAt: 'desc' } })
  response.json({ users })
})

router.patch('/users/:id/ban', async (request, response) => {
  const user = await prisma.user.update({ where: { id: request.params.id }, data: { isBanned: request.body.banned !== false } })
  response.json({ user: { id: user.id, isBanned: user.isBanned } })
})

router.delete('/users/:id', async (request, response) => {
  if (request.params.id === request.user.userId) return response.status(400).json({ error: 'You cannot delete your own account' })
  const target = await prisma.user.findUnique({ where: { id: request.params.id }, select: { role: true } })
  if (!target) return response.status(404).json({ error: 'User not found' })
  if (target.role === 'ADMIN' && await prisma.user.count({ where: { role: 'ADMIN' } }) <= 1) return response.status(400).json({ error: 'The last admin cannot be deleted' })
  await prisma.$transaction(async (transaction) => {
    await transaction.appointment.deleteMany({ where: { OR: [{ parentId: request.params.id }, { professional: { ownerId: request.params.id } }] } })
    await transaction.user.delete({ where: { id: request.params.id } })
  })
  response.status(204).end()
})

router.post('/institutions', async (request, response) => {
  const { name, type, ownership, address, district, website, latitude, longitude } = request.body
  if (!name?.trim()) return response.status(400).json({ error: 'Institution name is required' })
  const institution = await prisma.institution.create({ data: { name: name.trim(), type, ownership, address, district, website, latitude: Number(latitude) || undefined, longitude: Number(longitude) || undefined, verificationStatus: 'VERIFIED' } })
  response.status(201).json({ institution })
})

router.patch('/institutions/:id', async (request, response) => {
  const institution = await prisma.institution.update({ where: { id: request.params.id }, data: request.body })
  response.json({ institution })
})

router.delete('/institutions/:id', async (request, response) => {
  await prisma.institution.delete({ where: { id: request.params.id } })
  response.status(204).end()
})

router.get('/resources/pending', async (_request, response) => {
  const resources = await prisma.resource.findMany({ where: { status: 'PENDING' }, include: { author: { select: { name: true, professionType: true } }, specialties: { include: { specialty: true } } }, orderBy: { createdAt: 'asc' } })
  response.json({ resources })
})

router.patch('/resources/:id', async (request, response) => {
  const resource = await prisma.resource.update({ where: { id: request.params.id }, data: { status: request.body.status, featured: request.body.featured, publishedAt: request.body.status === 'PUBLISHED' ? new Date() : null } })
  response.json({ resource })
})

router.delete('/resources/:id', async (request, response) => {
  await prisma.resource.delete({ where: { id: request.params.id } })
  response.status(204).end()
})

router.get('/admins', async (_request, response) => {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true, email: true, createdAt: true } })
  response.json({ admins })
})

router.post('/admins/promote/:userId', async (request, response) => {
  const actor = await prisma.user.findUnique({ where: { id: request.user.userId } })
  if (!actor || !(await bcrypt.compare(request.body.adminPassword || '', actor.passwordHash))) return response.status(403).json({ error: 'Current admin password is incorrect' })
  const user = await prisma.user.update({ where: { id: request.params.userId }, data: { role: 'ADMIN' } })
  response.json({ user: { id: user.id, role: user.role } })
})

router.post('/admins/create', async (request, response) => {
  const actor = await prisma.user.findUnique({ where: { id: request.user.userId } })
  if (!actor || !(await bcrypt.compare(request.body.adminPassword || '', actor.passwordHash))) return response.status(403).json({ error: 'Current admin password is incorrect' })
  if (!request.body.name || !request.body.email || !request.body.password) return response.status(400).json({ error: 'Name, email, and temporary password are required' })
  const user = await prisma.user.create({ data: { name: request.body.name.trim(), email: request.body.email.trim().toLowerCase(), passwordHash: await bcrypt.hash(request.body.password, 12), role: 'ADMIN', mustChangePassword: true } })
  response.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

router.delete('/admins/:id', async (request, response) => {
  const actor = await prisma.user.findUnique({ where: { id: request.user.userId } })
  if (!actor || !(await bcrypt.compare(request.body.adminPassword || '', actor.passwordHash))) return response.status(403).json({ error: 'Current admin password is incorrect' })
  if (await prisma.user.count({ where: { role: 'ADMIN' } }) <= 1) return response.status(400).json({ error: 'The last admin cannot be deleted' })
  await prisma.user.delete({ where: { id: request.params.id } })
  response.status(204).end()
})

export default router
