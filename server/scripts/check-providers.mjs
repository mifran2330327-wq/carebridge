import 'dotenv/config'
import XLSX from 'xlsx'
import { prisma } from '../src/lib/prisma.js'

async function check() {
  const count = await prisma.professional.count()
  console.log('Current DB professionals count:', count)

  const existing = await prisma.professional.findMany({
    select: { id: true, name: true, phone: true, ownerId: true }
  })
  console.log('Existing names:', existing.map(e => `${e.name} (hasOwner: ${!!e.ownerId})`))

  const wb = XLSX.readFile(new URL('../../list.xlsx', import.meta.url))
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Providers'], { defval: '' })
  console.log('XLS Providers total rows:', rows.length)
  rows.forEach((r, i) => {
    console.log(`${i+1}. [${r['Provider ID']}] ${r['Provider Name']} | ${r['Specialty']} | Phone: ${r['Phone']}`)
  })
  await prisma.$disconnect()
}

check().catch(console.error)
