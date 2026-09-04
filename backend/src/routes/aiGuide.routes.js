import { Router } from 'express'
import { chatWithGuide } from '../controllers/aiGuide.controller.js'

const router = Router()

// Public — the guide is meant to help people before they even sign up.
router.post('/', chatWithGuide)

export default router
