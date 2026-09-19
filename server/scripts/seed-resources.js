import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

const articles = [
  ['NDD Trust Bangladesh resource', 'https://nddtrust.gov.bd/pages/static-pages/6922de53933eb65569e19e16', 'NDD Trust (Govt. of Bangladesh)'],
  ['Autism and neurodevelopment research', 'https://pubmed.ncbi.nlm.nih.gov/39994812/', 'PubMed'],
  ['Developmental support research', 'https://pubmed.ncbi.nlm.nih.gov/36618722/', 'PubMed'],
  ['Autism intervention research', 'https://pubmed.ncbi.nlm.nih.gov/38693950/', 'PubMed'],
  ['Neurodevelopment research update', 'https://pubmed.ncbi.nlm.nih.gov/41068726/', 'PubMed'],
  ['Open access autism research', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3650850/', 'PubMed Central'],
  ['Inclusive education thesis', 'https://scholarworks.wmich.edu/cgi/viewcontent.cgi?article=3638&context=honors_theses', 'Western Michigan University'],
  ['Autism research resource', 'https://pubmed.ncbi.nlm.nih.gov/36836130/', 'PubMed'],
  ['Neurodevelopment research resource', 'https://pubmed.ncbi.nlm.nih.gov/33939721/', 'PubMed'],
  ['Open access developmental research', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13330892/', 'PubMed Central'],
  ['Developmental support research resource', 'https://pubmed.ncbi.nlm.nih.gov/41027705/', 'PubMed'],
  ['Special Needs Jungle', 'https://www.specialneedsjungle.com/', 'Special Needs Jungle'],
  ['Disability Scoop', 'https://www.disabilityscoop.com/', 'Disability Scoop'],
  ['Wrightslaw Blog', 'https://www.wrightslaw.com/blog/', 'Wrightslaw'],
  ['Mom and Medicine', 'https://www.momandmedicine.blog/', 'Mom and Medicine'],
  ['The Autism Helper', 'https://theautismhelper.com/', 'The Autism Helper'],
  ['Special Needs Early Childhood Education', 'https://www.continued.com/early-childhood-education/articles/special-needs/', 'Continued'],
  ['Children with Special Educational Needs', 'https://www.nidirect.gov.uk/articles/children-special-educational-needs', 'nidirect'],
  ['NCSE Resources for Parents', 'https://www.ncse.ie/parents/resources-for-parents/', 'NCSE Ireland'],
  ['SpecialKids Company Blog', 'https://specialkids.company/blogs/latest-news', 'SpecialKids Company'],
]
const videos = [
  'https://youtu.be/ZrWy7bTM1pk', 'https://youtu.be/x0LogNloQ30', 'https://youtu.be/_WCMqsIvSis', 'https://youtu.be/S0h_mBhNVck',
  'https://youtu.be/qA_9Vvbf_6I', 'https://youtu.be/YVN5FXvL3Xc', 'https://youtu.be/Py8pMr8KKmA', 'https://youtu.be/IGsXF2hPiLU',
  'https://youtu.be/MaUmpbuzpZM', 'https://youtu.be/QI-hEQPYwBI', 'https://youtu.be/rjVp20y5LgY', 'https://youtu.be/vEThYoHWzR8',
  'https://youtu.be/5rDjLBNcU0E', 'https://youtu.be/T9bu02vAVdk', 'https://youtu.be/DUrordQaLak', 'https://youtu.be/bZRQGxaItE8',
]
const specialty = await prisma.specialty.findFirst({ where: { name: 'Autism Spectrum Disorder' } })
const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
if (!admin) throw new Error('Run seed:admin before seed:resources')

for (const [title, externalUrl, sourceName] of articles) {
  const existing = await prisma.resource.findFirst({ where: { externalUrl } })
  if (!existing) await prisma.resource.create({ data: { type: 'ARTICLE', title, summary: `Read the full resource from ${sourceName}.`, externalUrl, sourceName, status: 'PUBLISHED', featured: false, publishedAt: new Date(), createdById: admin.id, specialties: specialty ? { create: [{ specialtyId: specialty.id }] } : undefined } })
}
for (const externalUrl of videos) {
  const existing = await prisma.resource.findFirst({ where: { externalUrl } })
  if (!existing) {
    const id = externalUrl.split('/').pop()
    await prisma.resource.create({ data: { type: 'VIDEO', title: `CareBridge video resource ${id}`, summary: 'Video resource for parents and caregivers.', externalUrl, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, sourceName: 'YouTube', status: 'PUBLISHED', publishedAt: new Date(), createdById: admin.id, specialties: specialty ? { create: [{ specialtyId: specialty.id }] } : undefined } })
  }
}
console.log(`Seeded ${articles.length} article links and ${videos.length} videos.`)
await prisma.$disconnect()
