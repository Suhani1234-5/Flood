import { prisma } from '@/lib/prisma';

/**
 * Test query to verify Prisma client connection to PostgreSQL.
 * Returns all users from the database.
 */
export async function getUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return users;
}
