import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const DEFAULT_PAGE_SIZE = 20

function parsePagination(query) {
  const take = Math.min(Math.max(parseInt(query.take || '20', 10), 1), 100)
  const skip = Math.max(parseInt(query.skip || '0', 10), 0)
  return { take, skip }
}

router.use(requireAuth)

// GET / - List notifications for current user with pagination
router.get('/', async (request, response) => {
  try {
    const { take, skip } = parsePagination(request.query)
    const { isRead } = request.query

    const where = { userId: request.user.userId }
    if (isRead !== undefined) where.isRead = isRead === 'true'

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: request.user.userId, isRead: false } }),
    ])

    response.json({ notifications, pagination: { total, take, skip }, unreadCount })
  } catch (error) {
    console.error('Failed to get notifications:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch notifications' })
  }
})

// PATCH /:id/read - Mark notification as read
router.patch('/:id/read', async (request, response) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: request.params.id } })
    if (!notification) return response.status(404).json({ error: 'Notification not found' })
    if (notification.userId !== request.user.userId) return response.status(403).json({ error: 'Not your notification' })

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    })
    response.json({ notification: updated })
  } catch (error) {
    console.error('Failed to update notification:', error)
    response.status(500).json({ error: error.message || 'Failed to update notification' })
  }
})

// PATCH /read-all - Mark all as read
router.patch('/read-all', async (request, response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: request.user.userId, isRead: false },
      data: { isRead: true },
    })
    response.json({ ok: true })
  } catch (error) {
    console.error('Failed to mark all notifications read:', error)
    response.status(500).json({ error: error.message || 'Failed to mark notifications read' })
  }
})

export default router