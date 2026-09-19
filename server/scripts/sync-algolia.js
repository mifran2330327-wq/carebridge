import 'dotenv/config'
import { algoliasearch } from 'algoliasearch'
import { prisma } from '../src/lib/prisma.js'

const appId = process.env.ALGOLIA_APP_ID
const adminKey = process.env.ALGOLIA_ADMIN_KEY
const indexName = process.env.ALGOLIA_INDEX || 'carebridge_content'

if (!appId || !adminKey) {
  throw new Error('ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY are required')
}

const clean = (value) => typeof value === 'string' ? value.trim() : ''
const joinText = (...values) => values.map(clean).filter(Boolean).join(' • ')
const client = algoliasearch(appId, adminKey)

const [professionalRows, institutionRows, resourceRows] = await Promise.all([
  prisma.professional.findMany({
    select: {
      id: true,
      name: true,
      specialty: true,
      qualification: true,
      focus: true,
      providerType: true,
      professionType: true,
      location: true,
      chamber: true,
      chamberAddress: true,
      phone: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
      institution: {
        select: {
          name: true,
          district: true,
          area: true,
          address: true,
        },
      },
      specialties: {
        select: {
          specialty: {
            select: { name: true },
          },
        },
      },
      degrees: {
        select: {
          degree: {
            select: { name: true },
          },
        },
      },
    },
  }),
  prisma.institution.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      ownership: true,
      ageRange: true,
      district: true,
      area: true,
      address: true,
      website: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
    },
  }),
  prisma.resource.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  }),
])

const professionalRecords = professionalRows.map((professional) => {
  const specialtyNames = [
    professional.specialty,
    ...professional.specialties.map((item) => item.specialty.name),
  ].filter(Boolean)

  const degreeNames = professional.degrees.map((item) => item.degree.name)

  return {
    objectID: `professional_${professional.id}`,
    title: professional.name,
    description: joinText(
      professional.specialty,
      professional.qualification,
      professional.focus,
      professional.chamber,
      professional.institution?.name,
      professional.location,
    ),
    category: 'Professional',
    specialty: [...new Set(specialtyNames)].join(', '),
    degrees: degreeNames.join(', '),
    verificationStatus: professional.verificationStatus,
    keywords: [
      'doctor',
      'physician',
      'specialist',
      'therapist',
      professional.providerType,
      professional.professionType,
      professional.specialty,
      professional.focus,
      ...specialtyNames,
    ].map(clean).filter(Boolean),
    location: joinText(
      professional.location,
      professional.chamberAddress,
      professional.institution?.district,
      professional.institution?.area,
    ),
    phone: professional.phone || undefined,
    latitude: professional.latitude || undefined,
    longitude: professional.longitude || undefined,
    url: '/professionals',
  }
})

const institutionRecords = institutionRows.map((institution) => ({
  objectID: `institution_${institution.id}`,
  title: institution.name,
  description: joinText(
    institution.type,
    institution.ownership,
    institution.ageRange,
    institution.address,
    institution.district,
    institution.area,
  ),
  category: 'Institution',
  location: joinText(
    institution.district,
    institution.area,
    institution.address,
  ),
  website: institution.website || undefined,
  latitude: institution.latitude || undefined,
  longitude: institution.longitude || undefined,
  verificationStatus: institution.verificationStatus,
  keywords: [
    'school',
    'hospital',
    'center',
    'centre',
    'institution',
    'care',
    'child',
    'children',
    institution.type,
    institution.ownership,
    institution.ageRange,
  ].map(clean).filter(Boolean),
  url: '/schools',
}))

const resourceRecords = resourceRows.map((resource) => {
  const specialtyNames = resource.specialties.map((item) => item.specialty.name)

  return {
    objectID: `resource_${resource.id}`,
    title: resource.title,
    description: joinText(
      resource.summary,
      resource.sourceName,
      specialtyNames.join(', '),
    ),
    category: 'Resource',
    resourceType: resource.type,
    specialty: specialtyNames.join(', '),
    url: resource.externalUrl || '/resources',
  }
})

const records = [
  ...professionalRecords,
  ...institutionRecords,
  ...resourceRecords,
]

await client.setSettings({
  indexName,
  indexSettings: {
    searchableAttributes: [
      'title',
      'keywords',
      'description',
      'specialty',
      'degrees',
      'location',
      'category',
    ],
    attributesForFaceting: [
      'filterOnly(category)',
      'specialty',
      'location',
    ],
  },
})

await client.replaceAllObjects({
  indexName,
  objects: records,
})

console.log(`Uploaded ${records.length} records to Algolia index "${indexName}"`)

await prisma.$disconnect()
