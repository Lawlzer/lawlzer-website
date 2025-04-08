// Test MongoDB connection with Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection
    console.log('Testing MongoDB connection...');
    const result = await prisma.$runCommandRaw({
      ping: 1
    });
    console.log('Connection successful:', result);

    // Test query
    console.log('Testing query...');
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
