import { testApiHandler } from 'next-test-api-route-handler';
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

describe('GitHub OAuth Callback', () => {
	const mockCode = 'test-github-auth-code';
	const mockAccessToken = 'test-github-access-token';
	const mockTokenResponse = {
		access_token: mockAccessToken,
		scope: 'read:user user:email',
		token_type: 'bearer',
	};

	const mockGitHubUser = {
		id: 123456,
		login: 'githubuser',
		name: 'GitHub User',
		email: 'test@github.com',
		avatar_url: 'https://avatars.githubusercontent.com/u/123456',
	};

	const mockGitHubEmails = [
		{
			email: 'test@github.com',
			primary: true,
			verified: true,
			visibility: 'public',
		},
		{
			email: 'secondary@github.com',
			primary: false,
			verified: true,
			visibility: 'private',
		},
	];

	const mockUser = {
		id: 'test-user-id',
		email: 'test@github.com',
		name: 'GitHub User',
		emailVerified: new Date(),
		image: 'https://avatars.githubusercontent.com/u/123456',
		discordId: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		// Setup environment
		vi.stubEnv('NEXT_PUBLIC_AUTH_GITHUB_ID', 'test-github-client-id');
		vi.stubEnv('AUTH_GITHUB_SECRET', 'test-github-client-secret');
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

	it('should handle successful GitHub OAuth callback', async () => {
		// Mock fetch responses
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUser,
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
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				// Should redirect after successful auth
				expect(response.status).toBe(302);

				// Verify GitHub API calls
				const fetchMock = mockFetch;
				expect(fetchMock).toHaveBeenCalledTimes(2);

				// Verify token exchange
				expect(fetchMock).toHaveBeenNthCalledWith(
					1,
					'https://github.com/login/oauth/access_token',
					expect.objectContaining({
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							Accept: 'application/json',
						},
						body: expect.any(URLSearchParams),
					})
				);

				// Verify user info fetch
				expect(fetchMock).toHaveBeenNthCalledWith(
					2,
					'https://api.github.com/user',
					expect.objectContaining({
						headers: {
							Authorization: `Bearer ${mockAccessToken}`,
							Accept: 'application/vnd.github.v3+json',
						},
					})
				);

				// Verify session creation was called
				expect(handleAndGenerateSessionToken).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
			},
		});
	});

	it('should fetch email from /user/emails when not available in /user', async () => {
		const mockGitHubUserNoEmail = { ...mockGitHubUser, email: null };

		// Mock fetch responses
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUserNoEmail,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubEmails,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma upsert
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(302);

				// Verify all three API calls were made
				expect(mockFetch).toHaveBeenCalledTimes(3);

				// Verify emails endpoint was called
				expect(mockFetch).toHaveBeenNthCalledWith(
					3,
					'https://api.github.com/user/emails',
					expect.objectContaining({
						headers: {
							Authorization: `Bearer ${mockAccessToken}`,
							Accept: 'application/vnd.github.v3+json',
						},
					})
				);
			},
		});
	});

	it('should redirect to error page when no code is provided', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			url: '/api/auth/callback/github',
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=no_code');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle GitHub token exchange failure', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		// Mock failed token exchange
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'bad_verification_code', error_description: 'The code passed is incorrect' }),
		} as Response);

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle GitHub user fetch failure', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		// Mock successful token exchange
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			// Mock failed user fetch
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Bad credentials' }),
			} as Response);

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle missing access_token in response', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		// Mock response without access_token
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ error: 'invalid_request' }),
		} as Response);

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle case when no verified email is found', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		const mockGitHubUserNoEmail = { ...mockGitHubUser, email: null };
		const mockUnverifiedEmails = [
			{
				email: 'unverified@github.com',
				primary: true,
				verified: false,
				visibility: 'private',
			},
		];

		// Mock fetch responses
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUserNoEmail,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUnverifiedEmails,
			} as Response);

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle database upsert failure', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		// Mock successful GitHub API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUser,
			} as Response);

		// Mock prisma to throw error
		mockPrismaUser.upsert.mockRejectedValue(new Error('Database connection failed'));

		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should correctly convert numeric GitHub ID to string', async () => {
		// Mock successful GitHub API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUser,
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
			params: { code: mockCode },
			url: `/api/auth/callback/github?code=${mockCode}`,
			test: async ({ fetch }) => {
				await fetch({ method: 'GET' });

				// Verify numeric ID was converted to string
				expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						create: expect.objectContaining({
							accounts: expect.objectContaining({
								create: expect.objectContaining({
									providerAccountId: '123456', // Should be string
								}),
							}),
						}),
					})
				);
			},
		});
	});
});
