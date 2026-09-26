import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { createNotification } from '../lib/notification.js'

const router = Router()
router.use(requireAuth)

const DEFAULT_PAGE_SIZE = 20

function parsePagination(query) {
  const take = Math.min(Math.max(parseInt(query.take || '20', 10), 1), 100)
  const skip = Math.max(parseInt(query.skip || '0', 10), 0)
  return { take, skip }
}

router.get('/', async (request, response) => {
  try {
    const { take, skip } = parsePagination(request.query)
    const where = request.user.role === 'DOCTOR'
      ? { professional: { ownerId: request.user.userId } }
      : { parentId: request.user.userId }
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: { parent: { select: { name: true, email: true } }, professional: true },
        orderBy: { scheduledAt: 'asc' },
        take,
        skip,
      }),
      prisma.appointment.count({ where }),
    ])
    response.json({ appointments, pagination: { total, take, skip } })
  } catch (error) {
    console.error('Failed to get appointments:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch appointments' })
  }
})

function checkVisitingDay(visitingDays, scheduledAt) {
  if (!visitingDays) return true
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const d = new Date(scheduledAt)
  const dayIndex = d.getDay()
  const fullDay = days[dayIndex]
  const shortDay = shortDays[dayIndex]

  const str = visitingDays.toLowerCase().trim()
  if (str.includes('daily') || str.includes('everyday') || str.includes('all day') || str.includes('request') || str.includes('any')) {
    return true
  }

  // Direct word match
  if (str.includes(fullDay) || str.includes(shortDay)) {
    return true
  }

  // Range match e.g. "sat-tue" or "sat - wed" or "saturday to tuesday"
  const rangeMatch = str.match(/([a-z]{3,9})\s*(?:-|to)\s*([a-z]{3,9})/)
  if (rangeMatch) {
    const startIdx = shortDays.findIndex(s => rangeMatch[1].startsWith(s))
    const endIdx = shortDays.findIndex(s => rangeMatch[2].startsWith(s))
    if (startIdx !== -1 && endIdx !== -1) {
      if (startIdx <= endIdx) {
        if (dayIndex >= startIdx && dayIndex <= endIdx) return true
      } else {
        if (dayIndex >= startIdx || dayIndex <= endIdx) return true
      }
    }
  }

  return true
}

router.post('/', async (request, response) => {
  if (request.user.role !== 'PARENT') return response.status(403).json({ error: 'Only parents can book appointments' })
  const { professionalId, childId, scheduledAt, notes } = request.body || {}
  if (!professionalId || !childId || !scheduledAt) return response.status(400).json({ error: 'Professional, child, and appointment time are required' })

  try {
    const [child, professional] = await Promise.all([
      prisma.child.findFirst({ where: { id: childId, parentId: request.user.userId } }),
      prisma.professional.findUnique({ where: { id: professionalId } }),
    ])
    if (!child) return response.status(404).json({ error: 'Child profile not found' })
    if (!professional) return response.status(404).json({ error: 'Professional not found' })

    if (!professional.ownerId) {
      return response.status(400).json({
        error: `Dr. ${professional.name} has not enabled in-app booking. Please call their chamber directly at ${professional.phone || 'their listed phone number'}.`
      })
    }

    if (professional.visitingDays && !checkVisitingDay(professional.visitingDays, scheduledAt)) {
      return response.status(400).json({ error: `This professional is listed as available on: ${professional.visitingDays}` })
    }

    // Conflict check: ensure no CONFIRMED appointment at the exact same time
    const scheduledTime = new Date(scheduledAt)
    const bufferMinutes = 20
    const conflict = await prisma.appointment.findFirst({
      where: {
        professionalId,
        status: 'CONFIRMED',
        scheduledAt: {
          gte: new Date(scheduledTime.getTime() - bufferMinutes * 60 * 1000),
          lte: new Date(scheduledTime.getTime() + bufferMinutes * 60 * 1000),
        },
      },
    })
    if (conflict) {
      return response.status(409).json({ error: 'This doctor already has a confirmed session at this time. Please choose another slot.' })
    }

    const appointment = await prisma.appointment.create({
      data: {
        professionalId,
        parentId: request.user.userId,
        scheduledAt: new Date(scheduledAt),
        notes: [child.name, notes].filter(Boolean).join(' - '),
        status: 'REQUESTED',
      },
      include: { professional: true },
    })

    // Notify doctor
    if (professional.ownerId) {
      await createNotification({
        userId: professional.ownerId,
        type: 'APPOINTMENT_REQUESTED',
        message: `New appointment request from ${request.user.name} for child ${child.name} on ${new Date(scheduledAt).toLocaleString()}`,
        link: '/dashboard',
      })
    }

    // Notify parent
    await createNotification({
      userId: request.user.userId,
      type: 'APPOINTMENT_REQUESTED',
      message: `Appointment request sent to Dr. ${professional.name} for ${child.name}. You will be notified once accepted.`,
      link: '/appointments',
    })

    response.status(201).json({ appointment })
  } catch (error) {
    console.error('Failed to create appointment:', error)
    response.status(500).json({ error: error.message || 'Unable to book appointment' })
  }
})

router.patch('/:id/status', async (request, response) => {
  const allowed = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
  if (!allowed.includes(request.body.status)) return response.status(400).json({ error: 'Invalid appointment status' })

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: request.params.id }, include: { professional: true, parent: { select: { id: true, name: true } } } })
    if (!appointment) return response.status(404).json({ error: 'Appointment not found' })
    const canUpdate = appointment.parentId === request.user.userId || appointment.professional?.ownerId === request.user.userId
    if (!canUpdate) return response.status(403).json({ error: 'You cannot update this appointment' })
    const oldStatus = appointment.status
    const updated = await prisma.appointment.update({ where: { id: appointment.id }, data: { status: request.body.status } })

    // Notify parent of status change
    if (oldStatus !== request.body.status && appointment.parentId !== request.user.userId) {
      const isAccepted = request.body.status === 'CONFIRMED'
      await createNotification({
        userId: appointment.parentId,
        type: 'APPOINTMENT_STATUS',
        message: isAccepted
          ? `Dr. ${appointment.professional?.name} has ACCEPTED your appointment request for ${new Date(appointment.scheduledAt).toLocaleString()}!`
          : `Your appointment with Dr. ${appointment.professional?.name} is now ${request.body.status.toLowerCase()}`,
        link: '/appointments',
      })
    }
    // Notify professional of status change
    if (oldStatus !== request.body.status && appointment.professional?.ownerId && appointment.professional.ownerId !== request.user.userId) {
      await createNotification({
        userId: appointment.professional.ownerId,
        type: 'APPOINTMENT_STATUS',
        message: `Appointment with ${appointment.parent?.name} is now ${request.body.status.toLowerCase()}`,
        link: '/appointments',
      })
    }

    response.json({ appointment: updated })
  } catch (error) {
    console.error('Failed to update appointment status:', error)
    response.status(500).json({ error: error.message || 'Unable to update appointment' })
  }
})

// PATCH /:id/reschedule — doctor or parent proposes new time
router.patch('/:id/reschedule', async (request, response) => {
  const { scheduledAt } = request.body
  if (!scheduledAt) return response.status(400).json({ error: 'New date/time is required' })

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: request.params.id }, include: { professional: true, parent: { select: { id: true, name: true } } } })
    if (!appointment) return response.status(404).json({ error: 'Appointment not found' })
    const isDoctor = appointment.professional?.ownerId === request.user.userId
    const isParent = appointment.parentId === request.user.userId
    if (!isDoctor && !isParent) return response.status(403).json({ error: 'Not authorized' })

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { scheduledAt: new Date(scheduledAt), status: 'REQUESTED' },
    })

    // Notify the other party
    const notifyUserId = isDoctor ? appointment.parentId : appointment.professional?.ownerId
    if (notifyUserId) {
      await createNotification({
        userId: notifyUserId,
        type: 'APPOINTMENT_STATUS',
        message: isDoctor
          ? `Dr. ${appointment.professional?.name} has proposed a new time for your appointment on ${new Date(scheduledAt).toLocaleString()}`
          : `${appointment.parent?.name} requested a reschedule for their appointment with ${appointment.professional?.name}`,
        link: '/appointments',
      })
    }

    response.json({ appointment: updated })
  } catch (error) {
    console.error('Failed to reschedule appointment:', error)
    response.status(500).json({ error: error.message || 'Unable to reschedule appointment' })
  }
})

export default router
