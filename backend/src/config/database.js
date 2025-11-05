const { PrismaClient } = require('@prisma/client');

// Create a single instance of PrismaClient with connection pool settings
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Reduced logging to prevent connection overload
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
