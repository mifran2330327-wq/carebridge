import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function createToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, professional: user.professional || null }
}

router.post('/register', async (request, response) => {
  const { name, email, password, role = 'PARENT', professional } = request.body
  if (!name || !email || !password || password.length < 8) {
    return response.status(400).json({ error: 'Name, email, and an 8-character password are required' })
  }
  if (!['PARENT', 'DOCTOR'].includes(role)) return response.status(400).json({ error: 'Choose parent or doctor account type' })
  if (role === 'DOCTOR' && (!professional?.specialties?.length || !professional?.degrees?.length || !professional?.location || !professional?.visitingDays || !professional?.visitingHours || !professional?.nidNumber)) {
    return response.status(400).json({ error: 'Doctors must provide specialty, qualification, location, available days, and available hours' })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) return response.status(409).json({ error: 'An account with this email already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: name.trim(), email: normalizedEmail, passwordHash, role,
        professional: role === 'DOCTOR' ? { create: {
          name: name.trim(), specialty: professional.specialties?.join('; ') || professional.specialty.trim(), professionType: professional.professionType?.trim() || professional.providerType?.trim() || 'Doctor', qualification: professional.degrees?.join(', ') || professional.qualification.trim(),
          description: professional.description?.trim() || undefined, providerType: professional.providerType?.trim() || 'Doctor',
          location: professional.location.trim(), phone: professional.phone?.trim() || undefined,
          visitingDays: professional.visitingDays.trim(), visitingHours: professional.visitingHours.trim(), chamber: professional.chamber?.trim() || undefined,
          chamberAddress: professional.chamberAddress?.trim() || professional.chamber?.trim() || undefined,
          licenseAuthority: professional.licenseAuthority?.trim() || undefined, licenseNumber: professional.licenseNumber?.trim() || undefined,
          nidNumber: professional.nidNumber?.trim() || undefined,
          degrees: { create: (professional.degrees || []).map((name) => ({ degree: { connectOrCreate: { where: { name: name.trim() }, create: { name: name.trim(), isCustom: true } } } })) },
          specialties: { create: (professional.specialties || []).map((name) => ({ specialty: { connectOrCreate: { where: { name: name.trim() }, create: { name: name.trim(), isCustom: true } } } })) },
          email: normalizedEmail, verificationStatus: 'PENDING',
        } } : undefined,
      },
      include: { professional: true },
    })
    response.status(201).json({ token: createToken(user), user: publicUser(user) })
  } catch (error) {
    console.error('Registration failed:', error)
    response.status(500).json({ error: 'Unable to create account' })
  }
})

router.post('/login', async (request, response) => {
  const { email, password } = request.body
  if (!email || !password) return response.status(400).json({ error: 'Email and password are required' })

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { professional: true } })
    if (!user || user.isBanned || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Invalid email or password' })
    }
    response.json({ token: createToken(user), user: publicUser(user) })
  } catch (error) {
    console.error('Login failed:', error)
    response.status(500).json({ error: 'Unable to log in' })
  }
})

router.patch('/professional', requireAuth, async (request, response) => {
  if (request.user.role !== 'DOCTOR') return response.status(403).json({ error: 'Professional access required' })
  const { name, professionType, specialties = [], degrees = [], location, chamber, phone, visitingDays, visitingHours, licenseAuthority, licenseNumber, nidNumber, description } = request.body
  if (!name?.trim() || !professionType?.trim() || !specialties.length || !degrees.length || !location?.trim() || !visitingDays?.trim() || !visitingHours?.trim() || !nidNumber?.trim()) {
    return response.status(400).json({ error: 'Name, profession, degrees, specialties, location, schedule, and NID are required' })
  }
  const professional = await prisma.professional.findUnique({ where: { ownerId: request.user.userId } })
  if (!professional) return response.status(404).json({ error: 'Professional profile not found' })
  const verificationChanged = professional.professionType !== professionType.trim() || professional.licenseNumber !== (licenseNumber?.trim() || null) || professional.nidNumber !== nidNumber.trim()
  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.doctorDegree.deleteMany({ where: { doctorId: professional.id } })
    await transaction.doctorSpecialty.deleteMany({ where: { doctorId: professional.id } })
    return transaction.professional.update({ where: { id: professional.id }, data: {
      name: name.trim(), professionType: professionType.trim(), specialty: specialties.join('; '), qualification: degrees.join(', '),
      location: location.trim(), chamber: chamber?.trim() || null, chamberAddress: chamber?.trim() || null, phone: phone?.trim() || null,
      visitingDays: visitingDays.trim(), visitingHours: visitingHours.trim(), licenseAuthority: licenseAuthority?.trim() || null,
      licenseNumber: licenseNumber?.trim() || null, nidNumber: nidNumber.trim(), description: description?.trim() || null,
      verificationStatus: verificationChanged ? 'PENDING' : undefined,
      degrees: { create: degrees.map((degree) => ({ degree: { connectOrCreate: { where: { name: degree.trim() }, create: { name: degree.trim(), isCustom: true } } } })) },
      specialties: { create: specialties.map((specialty) => ({ specialty: { connectOrCreate: { where: { name: specialty.trim() }, create: { name: specialty.trim(), isCustom: true } } } })) },
    } })
  })
  response.json({ professional: updated })
})

router.post('/certificates', requireAuth, async (request, response) => {
  if (request.user.role !== 'DOCTOR') return response.status(403).json({ error: 'Professional access required' })
  const { label, fileUrl } = request.body
  if (!label?.trim() || !fileUrl?.trim()) return response.status(400).json({ error: 'Certificate label and private storage path are required' })
  const professional = await prisma.professional.findUnique({ where: { ownerId: request.user.userId } })
  if (!professional) return response.status(404).json({ error: 'Professional profile not found' })
  const certificate = await prisma.certificate.create({ data: { doctorId: professional.id, label: label.trim(), fileUrl: fileUrl.trim() } })
  await prisma.professional.update({ where: { id: professional.id }, data: { verificationStatus: 'PENDING' } })
  response.status(201).json({ certificate })
})

export default router
