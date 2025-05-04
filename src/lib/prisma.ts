import { PrismaClient } from '../generated/prisma';

// Declare a global variable to hold the Prisma client instance.
// This prevents creating multiple instances in development due to hot reloading.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Optional: Log Prisma queries
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 