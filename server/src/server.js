import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { prisma } from './lib/prisma.js'
import authRouter from './routes/auth.js'
import childrenRouter from './routes/children.js'
import directoryRouter from './routes/directory.js'
import appointmentsRouter from './routes/appointments.js'
import adminRouter from './routes/admin.js'
import resourcesRouter from './routes/resources.js'

const app = express()
const port = Number(process.env.PORT ?? 5000)

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/children', childrenRouter)
app.use('/api/directory', directoryRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/resources', resourcesRouter)

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

const server = app.listen(port, () => {
  console.log(`CareBridge API listening on http://localhost:${port}`)
})

const shutdown = async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
