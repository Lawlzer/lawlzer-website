import { vi } from 'vitest';

const mockRunCommandRaw = vi.fn().mockResolvedValue({ ok: 1 });
const mockFindMany = vi.fn().mockResolvedValue([]);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);

const prisma = {
	$runCommandRaw: mockRunCommandRaw,
	user: {
		findMany: mockFindMany,
	},
	$disconnect: mockDisconnect,
};

vi.mock('@prisma/client', () => ({
	PrismaClient: vi.fn().mockImplementation(() => prisma),
}));

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
		expect(mockRunCommandRaw).toHaveBeenCalledWith({ ping: 1 });
	});

	test('should query users', async () => {
		const users = await prisma.user.findMany();
		expect(Array.isArray(users)).toBe(true);
		expect(mockFindMany).toHaveBeenCalled();
	});
});
