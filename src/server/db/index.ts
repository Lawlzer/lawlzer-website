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

// Connection check is now handled in instrumentation.ts
