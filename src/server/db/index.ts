import { PrismaClient } from '@prisma/client';

import { env } from '~/env.mjs';

const createPrismaClient = (): PrismaClient => {
	const prisma = new PrismaClient({
		log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	});

	return prisma;
};

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Add connection check
(async () => {
	try {
		await db.$connect();
		console.info('⚪ Database connection established successfully.');
	} catch (error) {
		console.error('🔴 Failed to connect to the database. Please ensure MongoDB is running.');
		console.error('Original error:', error);
		// Re-throwing the error to potentially halt server startup or clearly indicate the failure.
		throw error;
	}
})();
