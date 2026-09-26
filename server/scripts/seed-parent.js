import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

async function seedParent() {
  const passwordHash = await bcrypt.hash('ifran123', 12)
  const emails = ['ifran1@gamil.com', 'ifran1@gmail.com']
  const doctor = await prisma.professional.findFirst()

  for (const email of emails) {
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Ifran Hossain',
          role: 'PARENT',
        },
      })
      console.log(`Created parent user: ${email}`)
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, role: 'PARENT' },
      })
      console.log(`Updated parent user password: ${email}`)
    }

    // Check if children exist for this parent
    const existingChildren = await prisma.child.findMany({ where: { parentId: user.id } })
    let child = existingChildren[0]
    if (existingChildren.length === 0) {
      child = await prisma.child.create({
        data: {
          name: 'Ayan',
          dateOfBirth: new Date('2019-04-15'),
          supportNeeds: 'Autism Spectrum Disorder (Level 1)',
          conditionDescription: 'Ayan is 7 years old, loves drawing and puzzles. Responds well to visual routines.',
          parentId: user.id,
        },
      })
      await prisma.child.create({
        data: {
          name: 'Sara',
          dateOfBirth: new Date('2021-08-20'),
          supportNeeds: 'Speech & Language Delay',
          conditionDescription: 'Sara is working on expressive communication and vocabulary.',
          parentId: user.id,
        },
      })
      console.log(`Created children for ${email}`)
    }

    // Check if appointment exists
    if (doctor) {
      const existingAppt = await prisma.appointment.findFirst({ where: { parentId: user.id } })
      if (!existingAppt) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 5)
        nextWeek.setHours(10, 30, 0, 0)

        await prisma.appointment.create({
          data: {
            parentId: user.id,
            professionalId: doctor.id,
            scheduledAt: nextWeek,
            status: 'CONFIRMED',
            notes: `${child?.name || 'Ayan'} - Initial consultation for developmental assessment`,
          },
        })
        console.log(`Created sample appointment for ${email} with ${doctor.name}`)
      }
    }
  }

  await prisma.$disconnect()
  console.log('Parent seeding complete.')
}

seedParent().catch((err) => {
  console.error(err)
  process.exit(1)
})
