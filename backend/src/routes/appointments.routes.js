import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listAppointments, createAppointment, updateAppointment, cancelAppointment,
} from '../controllers/appointments.controller.js'

const router = Router()
router.use(requireAuth)

router.get('/', listAppointments)
router.post('/', createAppointment)
router.patch('/:id', updateAppointment)
router.delete('/:id', cancelAppointment)

export default router
