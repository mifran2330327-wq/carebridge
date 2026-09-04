import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import childrenRoutes from './routes/children.routes.js'
import professionalsRoutes from './routes/professionals.routes.js'
import schoolsRoutes from './routes/schools.routes.js'
import appointmentsRoutes from './routes/appointments.routes.js'
import forumRoutes from './routes/forum.routes.js'
import resourcesRoutes from './routes/resources.routes.js'
import favoritesRoutes from './routes/favorites.routes.js'
import recommendationsRoutes from './routes/recommendations.routes.js'
import aiGuideRoutes from './routes/aiGuide.routes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()

// Only allow the frontend's origin to call this API with credentials.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/children', childrenRoutes)
app.use('/api/professionals', professionalsRoutes)
app.use('/api/schools', schoolsRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/forum', forumRoutes)
app.use('/api/resources', resourcesRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/recommendations', recommendationsRoutes)
app.use('/api/ai-guide', aiGuideRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
