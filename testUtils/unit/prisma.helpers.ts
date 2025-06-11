import { vi } from 'vitest';

/**
 * Creates a mock Prisma user model with common methods
 *
 * @returns Mock user model with upsert, findUnique, etc.
 */
export function createMockPrismaUser() {
	return {
		upsert: vi.fn(),
		findUnique: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		count: vi.fn(),
	};
}

/**
 * Creates a mock Prisma session model with common methods
 *
 * @returns Mock session model
 */
export function createMockPrismaSession() {
	return {
		create: vi.fn(),
		findUnique: vi.fn(),
		findMany: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		deleteMany: vi.fn(),
	};
}

/**
 * Creates a mock Prisma account model with common methods
 *
 * @returns Mock account model
 */
export function createMockPrismaAccount() {
	return {
		create: vi.fn(),
		findUnique: vi.fn(),
		findMany: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		upsert: vi.fn(),
	};
}

/**
 * Creates a full mock Prisma client with all models
 *
 * @returns Mock Prisma client
 */
export function createMockPrismaClient() {
	return {
		user: createMockPrismaUser(),
		session: createMockPrismaSession(),
		account: createMockPrismaAccount(),
		$connect: vi.fn().mockResolvedValue(undefined),
		$disconnect: vi.fn().mockResolvedValue(undefined),
		$transaction: vi.fn(),
		$queryRaw: vi.fn(),
		$executeRaw: vi.fn(),
	};
}

/**
 * Sets up Prisma client mock for tests.
 * Must be called before importing code that uses Prisma.
 *
 * @example
 * ```typescript
 * const mockPrisma = setupPrismaMock();
 *
 * // In your test
 * mockPrisma.user.findUnique.mockResolvedValue(mockUser);
 * ```
 */
export function setupPrismaMock() {
	const mockPrismaClient = createMockPrismaClient();

	vi.doMock('@prisma/client', () => ({
		PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
	}));

	return mockPrismaClient;
}

/**
 * Resets all Prisma mock functions.
 * Useful in afterEach hooks.
 *
 * @param mockPrisma The mock Prisma client to reset
 */
export function resetPrismaMocks(mockPrisma: ReturnType<typeof createMockPrismaClient>) {
	Object.values(mockPrisma).forEach((model) => {
		if (typeof model === 'object' && model !== null) {
			Object.values(model).forEach((method) => {
				if (typeof method === 'function' && 'mockReset' in method) {
					method.mockReset();
				}
			});
		} else if (typeof model === 'function' && 'mockReset' in model) {
			model.mockReset();
		}
	});
}

/**
 * Creates a mock implementation for Prisma that can be used with vi.mock
 *
 * @example
 * ```typescript
 * // At the top of your test file
 * const mockPrismaUser = createMockPrismaUser();
 *
 * vi.mock('@prisma/client', () => ({
 *   PrismaClient: vi.fn().mockImplementation(() => ({
 *     user: mockPrismaUser,
 *   })),
 * }));
 * ```
 */
export function createPrismaMockImplementation(
	models: {
		user?: ReturnType<typeof createMockPrismaUser>;
		session?: ReturnType<typeof createMockPrismaSession>;
		account?: ReturnType<typeof createMockPrismaAccount>;
	} = {}
) {
	const client = {
		user: models.user || createMockPrismaUser(),
		session: models.session || createMockPrismaSession(),
		account: models.account || createMockPrismaAccount(),
		$connect: vi.fn().mockResolvedValue(undefined),
		$disconnect: vi.fn().mockResolvedValue(undefined),
		$transaction: vi.fn(),
		$queryRaw: vi.fn(),
		$executeRaw: vi.fn(),
	};

	return {
		PrismaClient: vi.fn().mockImplementation(() => client),
		client,
	};
}
