import { Router } from 'express'
import { listSchools, getSchool } from '../controllers/schools.controller.js'

const router = Router()

router.get('/', listSchools)
router.get('/:id', getSchool)

export default router
