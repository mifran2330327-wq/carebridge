import { Router } from 'express'
import { listProfessionals, getProfessional } from '../controllers/professionals.controller.js'

const router = Router()

// Public — no login required to browse the directory.
router.get('/', listProfessionals)
router.get('/:id', getProfessional)

export default router
