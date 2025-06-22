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

describe('GitHub OAuth Callback', () => {
	const mockCode = 'test-github-auth-code';
	const mockAccessToken = 'gho_testAccessToken123456789';
	const mockTokenResponse = {
		access_token: mockAccessToken,
		token_type: 'bearer',
		scope: 'read:user user:email',
	};

	const mockGitHubUser = {
		id: 12345678,
		login: 'githubuser',
		avatar_url: 'https://avatars.githubusercontent.com/u/12345678?v=4',
		name: 'GitHub User',
		email: 'test@github.com',
		bio: 'Test bio',
		blog: 'https://test.blog.com',
		company: 'Test Company',
		created_at: '2020-01-01T00:00:00Z',
		updated_at: '2023-01-01T00:00:00Z',
		public_repos: 10,
		followers: 50,
		following: 20,
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
			visibility: null,
		},
	];

	const mockUser = {
		id: 'test-user-id',
		email: 'test@github.com',
		name: 'GitHub User',
		emailVerified: new Date(),
		image: 'https://avatars.githubusercontent.com/u/12345678?v=4',
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
			// Token exchange
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			// User info
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUser,
			} as Response)
			// User emails
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubEmails,
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

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Should redirect after successful auth
		expect(response.status).toBe(302);

		// Verify GitHub API calls
		expect(mockFetch).toHaveBeenCalledTimes(2);

		// Verify token exchange
		expect(mockFetch).toHaveBeenNthCalledWith(
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
		expect(mockFetch).toHaveBeenNthCalledWith(
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
	});

	it('should redirect to error page when no code is provided', async () => {
		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=no_code');
	});

	it('should handle GitHub token exchange failure', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

		// Mock failed token exchange
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'bad_verification_code' }),
		} as Response);

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=bad_verification_code');

		// Restore console
		consoleMock.restore();
	});

	it('should handle GitHub user fetch failure', async () => {
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
				json: async () => ({ message: 'Bad credentials' }),
			} as Response);

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=Bad%20credentials');

		// Restore console
		consoleMock.restore();
	});

	it('should handle GitHub emails fetch failure but proceed with email from user data', async () => {
		// Mock successful token exchange and user fetch
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUser, // User has email
			} as Response);

		// Import modules dynamically
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

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Should succeed since user has email in profile
		expect(response.status).toBe(302);
	});

	it('should handle database upsert failure', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

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

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=Database%20connection%20failed');

		// Restore console
		consoleMock.restore();
	});

	it('should use primary verified email when available', async () => {
		// Mock successful GitHub API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ ...mockGitHubUser, email: null }), // No email in user data
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubEmails,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify all 3 API calls were made (token, user, emails)
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

		// Verify primary email was used
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					email: 'test@github.com', // Primary email
				},
			})
		);
	});

	it('should handle user without verified email', async () => {
		// Mock console methods to suppress expected output
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsole(['debug', 'log']);

		const noVerifiedEmails = [
			{
				email: 'unverified@github.com',
				primary: true,
				verified: false,
				visibility: 'public',
			},
		];

		// Mock successful GitHub API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ ...mockGitHubUser, email: null }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => noVerifiedEmails,
			} as Response);

		const handler = await import('./route');

		const response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Should redirect to error page when no verified email is found
		expect(response.status).toBe(307);
		const location = response.headers.get('location');
		expect(location).toContain('/error/auth?error=Could%20not%20retrieve%20a%20verified%20primary%20email%20from%20GitHub.');

		// Restore console
		consoleMock.restore();
	});

	it('should store GitHub account details correctly', async () => {
		// Mock successful GitHub API calls
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTokenResponse,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubUser,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockGitHubEmails,
			} as Response);

		// Import modules dynamically
		const { handleAndGenerateSessionToken } = await import('~/lib/auth');

		// Mock prisma to capture the call
		mockPrismaUser.upsert.mockResolvedValue(mockUser);

		// Mock session creation
		(handleAndGenerateSessionToken as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 302 }));

		const handler = await import('./route');

		const _response = await testRoute(handler, '/api/auth/callback/github', {
			method: 'GET',
			searchParams: { code: mockCode },
		});

		// Verify GitHub account is stored correctly
		expect(mockPrismaUser.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					accounts: expect.objectContaining({
						create: expect.objectContaining({
							type: 'oauth',
							provider: 'github',
							providerAccountId: String(mockGitHubUser.id),
							access_token: mockAccessToken,
							token_type: 'bearer',
							scope: 'read:user user:email',
						}),
					}),
				}),
			})
		);
	});
});
