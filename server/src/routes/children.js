import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (request, response) => {
  const children = await prisma.child.findMany({ where: { parentId: request.user.userId }, orderBy: { createdAt: 'asc' } })
  response.json({ children })
})

router.post('/', async (request, response) => {
  const { name, dateOfBirth, supportNeeds, conditionDescription } = request.body
  if (!name) return response.status(400).json({ error: 'Child name is required' })

  try {
    const child = await prisma.child.create({
      data: {
        name: name.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        supportNeeds: supportNeeds?.trim() || undefined,
        conditionDescription: conditionDescription?.trim() || undefined,
        parentId: request.user.userId,
      },
    })
    response.status(201).json({ child })
  } catch (error) {
    console.error('Child creation failed:', error)
    response.status(400).json({ error: 'Unable to create child profile' })
  }
})

router.delete('/:id', async (request, response) => {
  try {
    const result = await prisma.child.deleteMany({ where: { id: request.params.id, parentId: request.user.userId } })
    if (!result.count) return response.status(404).json({ error: 'Child profile not found' })
    response.status(204).end()
  } catch (error) {
    console.error('Child deletion failed:', error)
    response.status(400).json({ error: 'Unable to delete child profile' })
  }
})

export default router
