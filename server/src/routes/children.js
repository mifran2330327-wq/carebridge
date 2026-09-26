import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (request, response) => {
  try {
    const children = await prisma.child.findMany({ where: { parentId: request.user.userId }, orderBy: { createdAt: 'asc' } })
    response.json({ children })
  } catch (error) {
    console.error('Failed to get children:', error)
    response.status(500).json({ error: error.message || 'Failed to fetch child profiles' })
  }
})

router.post('/', async (request, response) => {
  const { name, dateOfBirth, supportNeeds, conditionDescription } = request.body || {}
  if (!name || !name.trim()) return response.status(400).json({ error: 'Child name is required' })

  let parsedDob = null
  if (dateOfBirth && String(dateOfBirth).trim() !== '') {
    const d = new Date(dateOfBirth)
    if (!isNaN(d.getTime())) {
      parsedDob = d
    }
  }

  try {
    const child = await prisma.child.create({
      data: {
        name: name.trim(),
        dateOfBirth: parsedDob,
        supportNeeds: supportNeeds?.trim() || null,
        conditionDescription: conditionDescription?.trim() || null,
        parentId: request.user.userId,
      },
    })
    response.status(201).json({ child })
  } catch (error) {
    console.error('Child creation failed:', error)
    response.status(400).json({ error: error.message || 'Unable to create child profile' })
  }
})

router.patch('/:id', async (request, response) => {
  const { name, dateOfBirth, supportNeeds, conditionDescription } = request.body || {}
  let parsedDob = undefined
  if (dateOfBirth !== undefined) {
    if (dateOfBirth && String(dateOfBirth).trim() !== '') {
      const d = new Date(dateOfBirth)
      if (!isNaN(d.getTime())) parsedDob = d
    } else {
      parsedDob = null
    }
  }

  try {
    const child = await prisma.child.findFirst({ where: { id: request.params.id, parentId: request.user.userId } })
    if (!child) return response.status(404).json({ error: 'Child profile not found' })

    const updated = await prisma.child.update({
      where: { id: child.id },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(parsedDob !== undefined ? { dateOfBirth: parsedDob } : {}),
        ...(supportNeeds !== undefined ? { supportNeeds: supportNeeds?.trim() || null } : {}),
        ...(conditionDescription !== undefined ? { conditionDescription: conditionDescription?.trim() || null } : {}),
      },
    })
    response.json({ child: updated })
  } catch (error) {
    console.error('Child update failed:', error)
    response.status(400).json({ error: error.message || 'Unable to update child profile' })
  }
})

router.delete('/:id', async (request, response) => {
  try {
    const result = await prisma.child.deleteMany({ where: { id: request.params.id, parentId: request.user.userId } })
    if (!result.count) return response.status(404).json({ error: 'Child profile not found' })
    response.status(204).end()
  } catch (error) {
    console.error('Child deletion failed:', error)
    response.status(400).json({ error: error.message || 'Unable to delete child profile' })
  }
})

export default router
