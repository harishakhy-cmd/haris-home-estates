import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  });
  console.log('=== USERS ===');
  console.log(users);

  const friendships = await prisma.friendship.findMany({
    include: {
      sender: { select: { email: true } },
      receiver: { select: { email: true } }
    }
  });
  console.log('=== FRIENDSHIPS ===');
  console.log(friendships);
}

main().catch(console.error).finally(() => prisma.$disconnect());
