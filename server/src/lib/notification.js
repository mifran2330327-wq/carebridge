import { prisma } from './prisma.js'

export async function createNotification({ userId, type, message, link }) {
  if (!userId) return null
  return prisma.notification.create({
    data: {
      userId,
      type,
      message,
      link,
    },
  })
}

export async function createNotificationForUserIds({ userIds, type, message, link }) {
  if (!userIds?.length) return
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message, link })),
  })
}