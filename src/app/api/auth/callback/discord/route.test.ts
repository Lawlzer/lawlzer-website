import { createMockPrismaUser } from 'testUtils/unit/prisma.helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { testRoute } from '../../../../../../testUtils/unit/api-route-test-helper';

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
	const mockCode = 'test-discord-auth-code';
	const mockAccessToken = 'test-discord-access-token';
	const mockRefreshToken = 'test-discord-refresh-token';
	const mockTokenResponse = {
		access_token: mockAccessToken,
		token_type: 'Bearer',
		expires_in: 604800, // 7 days
		refresh_token: mockRefreshToken,
		scope: 'identify email',
	};

	const mockDiscordUser = {
		id: '123456789012345678',
		username: 'discorduser',
		discriminator: '1234',
		avatar: 'a1b2c3d4e5f6',
		email: 'test@discord.com',
		verified: true,
		locale: 'en-US',
		mfa_enabled: false,
		flags: 0,
		premium_type: 0,
		public_flags: 0,
	};

	const mockUser = {
		id: 'test-user-id',
		email: 'test@discord.com',
		name: 'discorduser',
		emailVerified: new Date(),
		image: 'https://cdn.discordapp.com/avatars/123456789012345678/a1b2c3d4e5f6.png',
		discordId: '123456789012345678',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		// Setup environment
		vi.stubEnv('NEXT_PUBLIC_AUTH_DISCORD_ID', 'test-discord-client-id');
		vi.stubEnv('AUTH_DISCORD_SECRET', 'test-discord-client-secret');
		vi.stubEnv('NEXT_PUBLIC_SCHEME', 'http');
		vi.stubEnv('NEXT_PUBLIC_SECOND_LEVEL_DOMAIN', 'localhost');
		vi.stubEnv('NEXT_PUBLIC_TOP_LEVEL_DOMAIN', 'com');
		vi.stubEnv('NEXT_PUBLIC_FRONTEND_PORT', '3000');

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
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockDiscordUser,
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

		const response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Should redirect after successful auth
		expect(response.status).toBe(302);

		// Verify Discord API calls
		expect(mockFetch).toHaveBeenCalledTimes(2);

		// Verify token exchange
		expect(mockFetch).toHaveBeenNthCalledWith(
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
		expect(mockFetch).toHaveBeenNthCalledWith(
			2,
			'https://discord.com/api/users/@me',
			expect.objectContaining({
				headers: {
					Authorization: `Bearer ${mockAccessToken}`,
				},
			})
		);

		// Verify session creation was called
		expect(handleAndGenerateSessionToken).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
	});

	it('should redirect to error page when no code is provided', async () => {
		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=no_code');
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

		const response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=server_error');

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
				json: async () => mockTokenResponse,
			} as Response)
			// Mock failed user fetch
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: '401: Unauthorized' }),
			} as Response);

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=server_error');

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
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockDiscordUser,
			} as Response);

		// Mock prisma to throw error
		mockPrismaUser.upsert.mockRejectedValue(new Error('Database connection failed'));

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=server_error');

		// Restore console
		consoleMock.restore();
	});

	it('should handle unverified email correctly', async () => {
		const mockUnverifiedUser = { ...mockDiscordUser, verified: false };

		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUnverifiedUser,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify emailVerified is null for unverified emails
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					emailVerified: null,
				}),
			})
		);
	});

	it('should store refresh token when provided', async () => {
		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockDiscordUser,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify refresh token is stored
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					accounts: expect.objectContaining({
						create: expect.objectContaining({
							refresh_token: mockRefreshToken,
						}),
					}),
				}),
				update: expect.objectContaining({
					accounts: expect.objectContaining({
						upsert: expect.objectContaining({
							create: expect.objectContaining({
								refresh_token: mockRefreshToken,
							}),
							update: expect.objectContaining({
								refresh_token: mockRefreshToken,
							}),
						}),
					}),
				}),
			})
		);
	});

	it('should calculate expires_at correctly', async () => {
		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockDiscordUser,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		// Capture current time to verify expires_at calculation
		const beforeTime = Math.floor(Date.now() / 1000);

		const _response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		const afterTime = Math.floor(Date.now() / 1000);

		// Verify expires_at is calculated correctly
		const callArgs = mockPrismaUser.upsert.mock.calls[0][0];
		const expiresAt = callArgs.create.accounts.create.expires_at;

		// expires_at should be current time + expires_in (604800 seconds = 7 days)
		expect(expiresAt).toBeGreaterThanOrEqual(beforeTime + 604800);
		expect(expiresAt).toBeLessThanOrEqual(afterTime + 604800);
	});

	it('should correctly build avatar URL', async () => {
		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockDiscordUser,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify avatar URL was built correctly
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					image: `https://cdn.discordapp.com/avatars/${mockDiscordUser.id}/${mockDiscordUser.avatar}.png`,
				}),
			})
		);
	});

	it('should use default avatar for users without custom avatar', async () => {
		const mockUserNoAvatar = { ...mockDiscordUser, avatar: null };

		// Mock successful Discord API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUserNoAvatar,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue({ ...mockUser, image: null });

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/discord', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify no image was set for users without avatar
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					image: null,
				}),
			})
		);
	});
});
