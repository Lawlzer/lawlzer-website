import { TRPCError } from '@trpc/server';
import { createMockTRPCSession } from 'testUtils/unit/data.factories';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { postRouter } from './post';

import { createTRPCContext } from '~/server/api/trpc';
import { db } from '~/server/db';

// Mock Prisma client
vi.mock('~/server/db', () => ({
	db: {
		post: {
			create: vi.fn(),
			findFirst: vi.fn(),
		},
	},
}));

describe('postRouter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('hello', () => {
		it('should return greeting with input text', async () => {
			// Create context without session (public procedure)
			const ctx = await createTRPCContext({
				headers: new Headers(),
			});

			// Create caller
			const caller = postRouter.createCaller(ctx);

			// Call the procedure
			const result = await caller.hello({ text: 'World' });

			// Assert
			expect(result).toEqual({ greeting: 'Hello World' });
		});

		it('should handle empty string', async () => {
			const ctx = await createTRPCContext({
				headers: new Headers(),
			});

			const caller = postRouter.createCaller(ctx);
			const result = await caller.hello({ text: '' });

			expect(result).toEqual({ greeting: 'Hello ' });
		});

		it('should handle special characters', async () => {
			const ctx = await createTRPCContext({
				headers: new Headers(),
			});

			const caller = postRouter.createCaller(ctx);
			const result = await caller.hello({ text: '🚀 TypeScript!' });

			expect(result).toEqual({ greeting: 'Hello 🚀 TypeScript!' });
		});
	});

	describe('create', () => {
		const mockSession = createMockTRPCSession();

		it('should create a post when authenticated', async () => {
			// Mock the database response
			const mockPost = {
				id: 'post-123',
				name: 'Test Post',
				createdById: 'test-user-id',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			(db.post.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

			// Create context with session
			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			// Manually set session for testing
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);
			const result = await caller.create({ name: 'Test Post' });

			// Assert
			expect(result).toEqual(mockPost);
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const mockCreate = db.post.create as ReturnType<typeof vi.fn>;
			expect(mockCreate).toHaveBeenCalledWith({
				data: {
					name: 'Test Post',
					createdBy: { connect: { id: 'test-user-id' } },
				},
			});
		});

		it('should throw UNAUTHORIZED when not authenticated', async () => {
			// Create context without session
			const ctx = await createTRPCContext({
				headers: new Headers(),
			});

			const caller = postRouter.createCaller(ctx);

			// Assert it throws
			await expect(caller.create({ name: 'Test Post' })).rejects.toThrow(TRPCError);
			await expect(caller.create({ name: 'Test Post' })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
			});
		});

		it('should validate input - empty name', async () => {
			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);

			// Should throw validation error for empty string
			await expect(caller.create({ name: '' })).rejects.toThrow();
		});

		it('should handle database errors gracefully', async () => {
			// Mock database error
			(db.post.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database connection failed'));

			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);

			// Should propagate the error
			await expect(caller.create({ name: 'Test Post' })).rejects.toThrow('Database connection failed');
		});
	});

	describe('getLatest', () => {
		const mockSession = createMockTRPCSession();

		it('should return latest post when exists', async () => {
			const mockPost = {
				id: 'post-123',
				name: 'Latest Post',
				createdById: 'test-user-id',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			(db.post.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);
			const result = await caller.getLatest();

			expect(result).toEqual(mockPost);
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const mockFindFirst = db.post.findFirst as ReturnType<typeof vi.fn>;
			expect(mockFindFirst).toHaveBeenCalledWith({
				orderBy: { createdAt: 'desc' },
				where: { createdBy: { id: 'test-user-id' } },
			});
		});

		it('should return null when no posts exist', async () => {
			(db.post.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);
			const result = await caller.getLatest();

			expect(result).toBeNull();
		});

		it('should throw UNAUTHORIZED when not authenticated', async () => {
			const ctx = await createTRPCContext({
				headers: new Headers(),
			});

			const caller = postRouter.createCaller(ctx);

			await expect(caller.getLatest()).rejects.toThrow(TRPCError);
			await expect(caller.getLatest()).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
			});
		});

		it('should handle database errors', async () => {
			(db.post.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database unavailable'));

			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);

			await expect(caller.getLatest()).rejects.toThrow('Database unavailable');
		});
	});

	describe('getSecretMessage', () => {
		const mockSession = createMockTRPCSession();

		it('should return secret message when authenticated', async () => {
			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);
			const result = await caller.getSecretMessage();

			expect(result).toBe('you can now see this secret message!');
		});

		it('should throw UNAUTHORIZED when not authenticated', async () => {
			const ctx = await createTRPCContext({
				headers: new Headers(),
			});

			const caller = postRouter.createCaller(ctx);

			await expect(caller.getSecretMessage()).rejects.toThrow(TRPCError);
			await expect(caller.getSecretMessage()).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
			});
		});

		it('should work with session regardless of expiry', async () => {
			// Since the Session type only has userId, we just need a valid session
			const headers = new Headers();
			headers.set('authorization', 'Bearer test-token');
			const ctx = await createTRPCContext({
				headers,
			});
			ctx.session = mockSession;

			const caller = postRouter.createCaller(ctx);

			// Should work as long as session exists
			const result = await caller.getSecretMessage();
			expect(result).toBe('you can now see this secret message!');
		});
	});
});
