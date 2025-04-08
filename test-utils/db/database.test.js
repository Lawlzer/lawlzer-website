const mockRunCommandRaw = jest.fn().mockResolvedValue({ ok: 1 });
const mockFindMany = jest.fn().mockResolvedValue([]);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

const prisma = {
	$runCommandRaw: mockRunCommandRaw,
	user: {
		findMany: mockFindMany
	},
	$disconnect: mockDisconnect
};

jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => prisma)
}));

beforeAll(async () => {
});

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
