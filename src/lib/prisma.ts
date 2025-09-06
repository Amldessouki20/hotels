import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

/**
 * Reset Prisma connection
 */
export async function resetPrismaConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    await prisma.$connect();
  } catch (error) {
    console.error('Error resetting Prisma connection:', error);
    throw error;
  }
}