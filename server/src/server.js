import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()
import cors from 'cors'
import express from 'express'
import { prisma } from './lib/prisma.js'
import authRouter from './routes/auth.js'
import childrenRouter from './routes/children.js'
import directoryRouter from './routes/directory.js'
import appointmentsRouter from './routes/appointments.js'
import adminRouter from './routes/admin.js'
import resourcesRouter from './routes/resources.js'
import communityRouter from './routes/community.js'
import notificationsRouter from './routes/notifications.js'

const app = express()
const port = Number(process.env.PORT ?? 5000)

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(express.text({ type: ['text/*', 'application/json'] }))
app.use((request, _response, next) => {
  if (typeof request.body === 'string') {
    try {
      request.body = JSON.parse(request.body)
    } catch {}
  }
  if (!request.body || typeof request.body !== 'object') {
    request.body = {}
  }
  next()
})
app.use('/api/auth', authRouter)
app.use('/api/children', childrenRouter)
app.use('/api/directory', directoryRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/community', communityRouter)
app.use('/api/notifications', notificationsRouter)

app.get('/api/lookups', async (request, response) => {
  const query = String(request.query.q || '').trim()
  const contains = query ? { contains: query, mode: 'insensitive' } : undefined
  const [degrees, specialties] = await Promise.all([
    prisma.degree.findMany({ where: contains ? { name: contains } : undefined, orderBy: { name: 'asc' }, take: 30 }),
    prisma.specialty.findMany({ where: contains ? { name: contains } : undefined, orderBy: { name: 'asc' }, take: 30 }),
  ])
  response.json({ degrees, specialties })
})

app.get('/api/health', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database health check failed:', error)
    response.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

app.use((err, request, response, next) => {
  console.error('Server error:', err)
  response.status(err.status || 500).json({ error: err.message || 'Unexpected server error' })
})

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`CareBridge API listening on http://localhost:${port}`)
})

const shutdown = async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
