import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

const degrees = ['MBBS', 'BDS', 'MD', 'MS', 'FCPS', 'MPH', 'Diploma in Child Health (DCH)', 'BSc in Speech and Language Therapy', 'MSc in Clinical Psychology', 'B.Ed in Special Education', 'Diploma in Occupational Therapy', 'BSc in Physiotherapy']
const specialties = ['Autism Spectrum Disorder', 'Down Syndrome', 'ADHD', 'Hearing Impairment', 'Visual Impairment', 'Speech and Language Difficulties', 'Physical Disability', 'Learning Difficulties', 'Developmental Delay', 'Occupational Therapy', 'Behavioural Therapy', 'Child Psychology', 'Special Education']

for (const name of degrees) await prisma.degree.upsert({ where: { name }, update: {}, create: { name } })
for (const name of specialties) await prisma.specialty.upsert({ where: { name }, update: {}, create: { name } })
console.log(`Seeded ${degrees.length} degrees and ${specialties.length} specialties.`)
await prisma.$disconnect()
