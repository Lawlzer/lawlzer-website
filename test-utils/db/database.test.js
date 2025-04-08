const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

beforeAll(async () => {});

afterAll(async () => {
	await prisma.$disconnect();
});

describe('Database Connection', () => {
	test('should connect to MongoDB successfully', async () => {
		const result = await prisma.$runCommandRaw({
			ping: 1,
		});
		expect(result).toBeDefined();
	});

	test('should query users', async () => {
		const users = await prisma.user.findMany();
		expect(Array.isArray(users)).toBe(true);
	});
});
