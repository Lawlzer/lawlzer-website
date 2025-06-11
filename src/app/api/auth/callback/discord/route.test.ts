import { testApiHandler } from 'next-test-api-route-handler';
import { createMockUserWithProvider, mockAuthData, setupAuthEnv } from 'testUtils/unit/auth.helpers';
import { createMockPrismaUser } from 'testUtils/unit/prisma.helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules before imports
vi.mock('~/lib/auth', () => ({
	handleAndGenerateSessionToken: vi.fn(),
}));

// Create a shared mock instance
const mockPrismaUser = createMockPrismaUser();

vi.mock('@prisma/client', () => ({
	PrismaClient: vi.fn().mockImplementation(() => ({
		user: mockPrismaUser,
	})),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Discord OAuth Callback', () => {
	const mockUser = createMockUserWithProvider('discord');

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		// Setup environment
		setupAuthEnv();

		// Reset fetch mock
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should handle successful Discord OAuth callback', async () => {
		// Mock fetch responses
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthData.discord.tokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthData.discord.user,
			} as Response);

		// Import modules dynamically after mocks are set
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma upsert
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(
			new Response(null, {
				status: 302,
				headers: {
					Location: '/',
				},
			})
		);

		// Import handler after environment is set
		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockAuthData.discord.code },
			url: `/api/auth/callback/discord?code=${mockAuthData.discord.code}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				// Should redirect after successful auth
				expect(response.status).toBe(302);

				// Verify Discord API calls
				const fetchMock = mockFetch;
				expect(fetchMock).toHaveBeenCalledTimes(2);

				// Verify token exchange
				expect(fetchMock).toHaveBeenNthCalledWith(
					1,
					'https://discord.com/api/oauth2/token',
					expect.objectContaining({
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: expect.any(URLSearchParams),
					})
				);

				// Verify user info fetch
				expect(fetchMock).toHaveBeenNthCalledWith(
					2,
					'https://discord.com/api/users/@me',
					expect.objectContaining({
						headers: {
							Authorization: `Bearer ${mockAuthData.discord.accessToken}`,
						},
					})
				);

				// Verify session creation was called
				expect(handleAndGenerateSessionToken).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
			},
		});
	});

	it('should redirect to error page when no code is provided', async () => {
		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			url: '/api/auth/callback/discord',
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307); // Temporary redirect
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=no_code');
			},
		});
	});

	it('should handle Discord token exchange failure', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

		// Mock failed token exchange
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'invalid_grant' }),
		} as Response);

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockAuthData.discord.code },
			url: `/api/auth/callback/discord?code=${mockAuthData.discord.code}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=server_error');
			},
		});

		// Restore console
		consoleMock.restore();
	});

	it('should handle Discord user fetch failure', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

		// Mock successful token exchange
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthData.discord.tokenResponse,
			} as Response)
			// Mock failed user fetch
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'unauthorized' }),
			} as Response);

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockAuthData.discord.code },
			url: `/api/auth/callback/discord?code=${mockAuthData.discord.code}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=server_error');
			},
		});

		// Restore console
		consoleMock.restore();
	});

	it('should handle database upsert failure', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthData.discord.tokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthData.discord.user,
			} as Response);

		// Mock prisma to throw error
		mockPrismaUser.upsert.mockRejectedValue(new Error('Database connection failed'));

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockAuthData.discord.code },
			url: `/api/auth/callback/discord?code=${mockAuthData.discord.code}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=server_error');
			},
		});

		// Restore console
		consoleMock.restore();
	});

	it('should correctly construct avatar URL', async () => {
		const mockDiscordUserWithAvatar = {
			...mockAuthData.discord.user,
			avatar: 'test-avatar-hash',
		};

		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthData.discord.tokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockDiscordUserWithAvatar,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockAuthData.discord.code },
			url: `/api/auth/callback/discord?code=${mockAuthData.discord.code}`,
			test: async ({ fetch }) => {
				await fetch({ method: 'GET' });

				// Verify avatar URL construction
				expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						create: expect.objectContaining({
							image: `https://cdn.discordapp.com/avatars/${mockDiscordUserWithAvatar.id}/test-avatar-hash.png`,
						}),
						update: expect.objectContaining({
							image: `https://cdn.discordapp.com/avatars/${mockDiscordUserWithAvatar.id}/test-avatar-hash.png`,
						}),
					})
				);
			},
		});
	});
});
