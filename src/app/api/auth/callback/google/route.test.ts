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

describe('Google OAuth Callback', () => {
	const mockCode = 'test-google-auth-code';
	const mockAccessToken = 'test-google-access-token';
	const mockIdToken = 'test-google-id-token';
	const mockRefreshToken = 'test-google-refresh-token';
	const mockTokenResponse = {
		access_token: mockAccessToken,
		expires_in: 3600, // 1 hour
		refresh_token: mockRefreshToken,
		scope: 'openid email profile',
		id_token: mockIdToken,
	};

	const mockGoogleUser = {
		id: 'google-user-id-123',
		email: 'test@gmail.com',
		verified_email: true,
		name: 'Google User',
		given_name: 'Google',
		family_name: 'User',
		picture: 'https://lh3.googleusercontent.com/a/test-avatar',
		locale: 'en',
	};

	const mockUser = {
		id: 'test-user-id',
		email: 'test@gmail.com',
		name: 'Google User',
		emailVerified: new Date(),
		image: 'https://lh3.googleusercontent.com/a/test-avatar',
		discordId: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		// Setup environment
		vi.stubEnv('NEXT_PUBLIC_AUTH_GOOGLE_ID', 'test-google-client-id');
		vi.stubEnv('AUTH_GOOGLE_SECRET', 'test-google-client-secret');
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

	it('should handle successful Google OAuth callback', async () => {
		// Mock fetch responses
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGoogleUser,
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

		const response = await testRoute(handler, '/api/auth/callback/google', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Should redirect after successful auth
		expect(response.status).toBe(302);

		// Verify Google API calls
		expect(mockFetch).toHaveBeenCalledTimes(2);

		// Verify token exchange
		expect(mockFetch).toHaveBeenNthCalledWith(
			1,
			'https://oauth2.googleapis.com/token',
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
			'https://www.googleapis.com/oauth2/v2/userinfo',
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

		const response = await testRoute(handler, '/api/auth/callback/google', {
			method: 'GET',
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=no_code');
	});

	it('should handle Google token exchange failure', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

		// Mock failed token exchange
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'invalid_grant' }),
		} as Response);

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/google', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=server_error');

		// Restore console
		consoleMock.restore();
	});

	it('should handle Google user fetch failure', async () => {
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
				json: async () => ({ error: 'invalid_token' }),
			} as Response);

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/google', {
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

		// Mock successful Google API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGoogleUser,
			} as Response);

		// Mock prisma to throw error
		mockPrismaUser.upsert.mockRejectedValue(new Error('Database connection failed'));

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/google', {
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
		const mockUnverifiedUser = { ...mockGoogleUser, verified_email: false };

		// Mock successful Google API calls
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

		const _response = await testRoute(handler, '/api/auth/callback/google', {
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
		// Mock successful Google API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGoogleUser,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/google', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify refresh token and id_token are stored
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					accounts: expect.objectContaining({
						create: expect.objectContaining({
							refresh_token: mockRefreshToken,
							id_token: mockIdToken,
						}),
					}),
				}),
				update: expect.objectContaining({
					accounts: expect.objectContaining({
						upsert: expect.objectContaining({
							create: expect.objectContaining({
								refresh_token: mockRefreshToken,
								id_token: mockIdToken,
							}),
							update: expect.objectContaining({
								refresh_token: mockRefreshToken,
								id_token: mockIdToken,
							}),
						}),
					}),
				}),
			})
		);
	});

	it('should calculate expires_at correctly', async () => {
		// Mock successful Google API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGoogleUser,
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

		const _response = await testRoute(handler, '/api/auth/callback/google', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		const afterTime = Math.floor(Date.now() / 1000);

		// Verify expires_at is calculated correctly
		const callArgs = mockPrismaUser.upsert.mock.calls[0][0];
		const expiresAt = callArgs.create.accounts.create.expires_at;

		// expires_at should be current time + expires_in (3600 seconds)
		expect(expiresAt).toBeGreaterThanOrEqual(beforeTime + 3600);
		expect(expiresAt).toBeLessThanOrEqual(afterTime + 3600);
	});
});
