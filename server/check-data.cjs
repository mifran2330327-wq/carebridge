const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany();
    const institutions = await prisma.institution.findMany();
    const professionals = await prisma.professional.findMany();
    const resources = await prisma.resource.findMany();
    const communityPosts = await prisma.communityPost.findMany();
    console.log('Users:');
    users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`));
    console.log('Institutions:', institutions.length);
    console.log('Professionals:', professionals.length);
    console.log('Resources:', resources.length);
    console.log('CommunityPosts:', communityPosts.length);
    if (professionals.length > 0) console.log('Sample professional:', professionals[0].name);
    if (institutions.length > 0) console.log('Sample institution:', institutions[0].name);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();