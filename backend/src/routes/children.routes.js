import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listChildren, createChild, updateChild, deleteChild } from '../controllers/children.controller.js'

const router = Router()

// Every route here requires a logged-in parent.
router.use(requireAuth)

router.get('/', listChildren)
router.post('/', createChild)
router.put('/:id', updateChild)
router.delete('/:id', deleteChild)

export default router
