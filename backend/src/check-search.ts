import { PrismaService } from './prisma/prisma.service';
import { UsersService } from './users/users.service';

const prisma = new PrismaService();
const service = new UsersService(prisma);

async function main() {
  const result = await service.search('', 'cmpxa61ea00076ejgb6ex3gqj');
  console.log('=== SEARCH RESULT FOR EMPTY QUERY ===');
  console.log(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
