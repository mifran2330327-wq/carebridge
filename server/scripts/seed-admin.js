import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
if (existing) {
  console.log(`Admin already exists: ${existing.email}`)
} else {
  const passwordHash = await bcrypt.hash('ifran1234', 12)
  const admin = await prisma.user.create({ data: { name: 'ifran admin', email: 'ifranadmin@gmail.com', passwordHash, role: 'ADMIN' } })
  console.log(`Seed admin created: ${admin.email}`)
}
await prisma.$disconnect()
