import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listFavorites, saveProfessional, unsaveProfessional, saveSchool, unsaveSchool,
} from '../controllers/favorites.controller.js'

const router = Router()
router.use(requireAuth)

router.get('/', listFavorites)
router.post('/professionals/:id', saveProfessional)
router.delete('/professionals/:id', unsaveProfessional)
router.post('/schools/:id', saveSchool)
router.delete('/schools/:id', unsaveSchool)

export default router
