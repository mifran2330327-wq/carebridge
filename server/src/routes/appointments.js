import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (request, response) => {
  const where = request.user.role === 'DOCTOR'
    ? { professional: { ownerId: request.user.userId } }
    : { parentId: request.user.userId }
  const appointments = await prisma.appointment.findMany({
    where,
    include: { parent: { select: { name: true, email: true } }, professional: true },
    orderBy: { scheduledAt: 'asc' },
  })
  response.json({ appointments })
})

router.post('/', async (request, response) => {
  if (request.user.role !== 'PARENT') return response.status(403).json({ error: 'Only parents can book appointments' })
  const { professionalId, childId, scheduledAt, notes } = request.body
  if (!professionalId || !childId || !scheduledAt) return response.status(400).json({ error: 'Professional, child, and appointment time are required' })

  const [child, professional] = await Promise.all([
    prisma.child.findFirst({ where: { id: childId, parentId: request.user.userId } }),
    prisma.professional.findUnique({ where: { id: professionalId } }),
  ])
  if (!child) return response.status(404).json({ error: 'Child profile not found' })
  if (!professional) return response.status(404).json({ error: 'Professional not found' })
  if (professional.visitingDays) {
    const requestedDay = new Date(scheduledAt).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const availableDays = professional.visitingDays.toLowerCase()
    if (!availableDays.includes(requestedDay)) return response.status(400).json({ error: `This professional is not available on ${requestedDay}` })
  }

  const appointment = await prisma.appointment.create({ data: {
    professionalId, parentId: request.user.userId, scheduledAt: new Date(scheduledAt),
    notes: [child.name, notes].filter(Boolean).join(' - '),
  }, include: { professional: true } })
  response.status(201).json({ appointment })
})

router.patch('/:id/status', async (request, response) => {
  const allowed = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
  if (!allowed.includes(request.body.status)) return response.status(400).json({ error: 'Invalid appointment status' })
  const appointment = await prisma.appointment.findUnique({ where: { id: request.params.id }, include: { professional: true } })
  const canUpdate = appointment && (appointment.parentId === request.user.userId || appointment.professional.ownerId === request.user.userId)
  if (!canUpdate) return response.status(403).json({ error: 'You cannot update this appointment' })
  const updated = await prisma.appointment.update({ where: { id: appointment.id }, data: { status: request.body.status } })
  response.json({ appointment: updated })
})

export default router
