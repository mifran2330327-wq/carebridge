import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listPosts, getPost, createPost, createReply } from '../controllers/forum.controller.js'

const router = Router()

// Reading the forum is public; posting/replying requires an account.
router.get('/', listPosts)
router.get('/:id', getPost)
router.post('/', requireAuth, createPost)
router.post('/:id/replies', requireAuth, createReply)

export default router
