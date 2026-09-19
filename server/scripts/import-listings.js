import 'dotenv/config'
import XLSX from 'xlsx'
import { prisma } from '../src/lib/prisma.js'

const workbook = XLSX.readFile(new URL('../../list.xlsx', import.meta.url))
const clean = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  return String(value).trim()
}
const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
const rows = (sheet) => XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '' })
const status = (value) => {
  const normalized = clean(value)?.toLowerCase()
  if (normalized === 'verified') return 'VERIFIED'
  if (normalized === 'rejected' || normalized === 'inactive/closed') return 'REJECTED'
  return 'PENDING'
}

const institutions = new Map()
for (const row of rows('Institutions')) {
  const externalId = clean(row['Institution ID'])
  const name = clean(row['Institution Name'])
  if (!externalId || !name) continue
  const institution = await prisma.institution.upsert({
    where: { externalId },
    update: {
      name, type: clean(row['Institution Type']), ownership: clean(row.Ownership), status: clean(row.Status),
      division: clean(row.Division), district: clean(row.District), area: clean(row.Area), address: clean(row['Full Address']),
      email: clean(row.Email), website: clean(row.Website), ageRange: clean(row['Age Range']),
      latitude: number(row.Latitide ?? row.Latitude), longitude: number(row.Longitude), verificationStatus: status(row['Verification Status']),
    },
    create: {
      externalId, name, type: clean(row['Institution Type']), ownership: clean(row.Ownership), status: clean(row.Status),
      division: clean(row.Division), district: clean(row.District), area: clean(row.Area), address: clean(row['Full Address']),
      email: clean(row.Email), website: clean(row.Website), ageRange: clean(row['Age Range']),
      latitude: number(row.Latitide ?? row.Latitude), longitude: number(row.Longitude), verificationStatus: status(row['Verification Status']),
    },
  })
  institutions.set(externalId, institution.id)
}

let providerCount = 0
for (const row of rows('Providers')) {
  const providerId = clean(row['Provider ID'])
  const name = clean(row['Provider Name'])
  if (!providerId || !name) continue
  const data = {
    name,
    specialty: clean(row.Specialty) || 'General developmental support',
    qualification: clean(row.Qualification), registrationNo: clean(row['Registration/License No.']),
    providerType: clean(row['Provider Type']), focus: clean(row['Autism/NDD Focus']),
    email: clean(row.Email), phone: clean(row.Phone), whatsapp: clean(row.WhatsApp),
    appointmentMethod: clean(row['Appointment Method']), consultationFee: clean(row['Consultation Fee']),
    visitingDays: clean(row['Visiting Days']), visitingHours: clean(row['Visiting Hours']), chamber: clean(row['Chamber/Department']),
    location: clean(row.Location), verificationStatus: status(row['Verification Status']),
    institutionId: institutions.get(clean(row['Institution ID'])),
    professionType: clean(row['Provider Type']),
  }
  const existing = await prisma.professional.findFirst({ where: { name, email: data.email || undefined } })
  const provider = existing
    ? await prisma.professional.update({ where: { id: existing.id }, data })
    : await prisma.professional.create({ data })
  const degreeNames = (data.qualification || '').split(',').map(clean).filter(Boolean)
  const specialtyNames = (data.specialty || '').split(';').map(clean).filter(Boolean)
  await prisma.doctorDegree.deleteMany({ where: { doctorId: provider.id } })
  await prisma.doctorSpecialty.deleteMany({ where: { doctorId: provider.id } })
  for (const name of degreeNames) {
    const degree = await prisma.degree.upsert({ where: { name }, update: {}, create: { name, isCustom: true } })
    await prisma.doctorDegree.create({ data: { doctorId: provider.id, degreeId: degree.id } })
  }
  for (const name of specialtyNames) {
    const specialty = await prisma.specialty.upsert({ where: { name }, update: {}, create: { name, isCustom: true } })
    await prisma.doctorSpecialty.create({ data: { doctorId: provider.id, specialtyId: specialty.id } })
  }
  providerCount += 1
}

console.log(`Imported ${institutions.size} institutions and ${providerCount} providers.`)
await prisma.$disconnect()
