const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected:', result);
  } catch (e) {
    console.error('Database error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();