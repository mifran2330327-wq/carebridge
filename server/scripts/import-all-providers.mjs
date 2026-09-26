import 'dotenv/config'
import XLSX from 'xlsx'
import { prisma } from '../src/lib/prisma.js'

const workbook = XLSX.readFile(new URL('../../list.xlsx', import.meta.url))
const clean = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  return String(value).trim()
}
const rows = (sheet) => XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '' })

async function importAllFast() {
  console.log('--- Starting Fast All Providers Import ---')
  const providerRows = rows('Providers')
  console.log(`Found ${providerRows.length} provider rows in list.xlsx`)

  // Preload institutions
  const allInstitutions = await prisma.institution.findMany({ select: { id: true, externalId: true } })
  const instMap = new Map()
  for (const inst of allInstitutions) {
    if (inst.externalId) instMap.set(inst.externalId, inst.id)
  }

  // Preload existing professionals
  const existingProfs = await prisma.professional.findMany({
    select: { id: true, name: true, chamber: true, ownerId: true }
  })

  let created = 0
  let updated = 0

  for (const row of providerRows) {
    const providerId = clean(row['Provider ID'])
    const name = clean(row['Provider Name'])
    if (!name) continue

    const phone = clean(row.Phone)
    const specialtyStr = clean(row.Specialty) || clean(row['Autism/NDD Focus']) || 'Pediatric Neurology & Developmental Support'
    const qualificationStr = clean(row.Qualification)
    const visitingDays = clean(row['Visiting Days'])
    const visitingHours = clean(row['Visiting Hours'])
    const chamber = clean(row['Chamber/Department'])
    const location = clean(row.Location) || 'Dhaka'
    const focus = clean(row['Autism/NDD Focus'])
    const appointmentMethod = clean(row['Appointment Method'])
    const consultationFee = clean(row['Consultation Fee'])
    const registrationNo = clean(row['Registration/License No.'])
    const providerType = clean(row['Provider Type']) || 'Doctor'
    const instExternalId = clean(row['Institution ID'])
    const institutionId = instExternalId ? instMap.get(instExternalId) : undefined

    const data = {
      name,
      specialty: specialtyStr,
      qualification: qualificationStr,
      registrationNo,
      providerType,
      professionType: providerType,
      focus,
      phone,
      email: clean(row.Email),
      whatsapp: clean(row.WhatsApp),
      appointmentMethod,
      consultationFee,
      visitingDays,
      visitingHours,
      chamber,
      location,
      verificationStatus: 'VERIFIED',
      institutionId,
    }

    // Match existing by name AND chamber (or phone)
    const match = existingProfs.find(p => p.name === name && (!chamber || p.chamber === chamber))
    if (match) {
      await prisma.professional.update({
        where: { id: match.id },
        data,
      })
      updated++
      console.log(`[UPDATED] ${name}`)
    } else {
      const newP = await prisma.professional.create({
        data,
      })
      existingProfs.push(newP)
      created++
      console.log(`[CREATED] ${name}`)
    }
  }

  const total = await prisma.professional.count()
  console.log(`\nImport complete! Created: ${created}, Updated: ${updated}. Total professionals in DB: ${total}`)
  process.exit(0)
}

importAllFast().catch((e) => {
  console.error(e)
  process.exit(1)
})
