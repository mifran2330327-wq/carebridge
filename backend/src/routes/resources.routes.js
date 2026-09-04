import { Router } from 'express'
import { listResources, getResource } from '../controllers/resources.controller.js'

const router = Router()

router.get('/', listResources)
router.get('/:id', getResource)

export default router
