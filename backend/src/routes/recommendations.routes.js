import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listRecommendations, generateRecommendations } from '../controllers/recommendations.controller.js'

const router = Router()
router.use(requireAuth)

router.get('/', listRecommendations)
router.post('/generate/:childId', generateRecommendations)

export default router
