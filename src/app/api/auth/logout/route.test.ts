import { testApiHandler } from 'next-test-api-route-handler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock session module
vi.mock('~/server/db/session', () => ({
	destroySession: vi.fn(),
}));

vi.mock('~/lib/auth', () => ({
	getCookieDomain: vi.fn().mockReturnValue('.example.com'),
}));

describe('/api/auth/logout', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should redirect to referer when logged out successfully', async () => {
		const { destroySession } = await import('~/server/db/session');
		(destroySession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						referer: 'http://localhost:3000/dashboard',
						cookie: 'session_token=valid-token',
					},
					redirect: 'manual',
				});

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toBe('http://localhost:3000/dashboard');

				// Verify destroySession was called
				expect(destroySession).toHaveBeenCalledWith('valid-token');

				// Check that session cookie was cleared
				const cookies = response.headers.getSetCookie();
				expect(cookies).toHaveLength(1);
				const sessionCookie = cookies.find((c) => c.startsWith('session_token='));
				expect(sessionCookie).toBeTruthy();
				expect(sessionCookie).toContain('session_token=');
				expect(sessionCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
				expect(sessionCookie).toContain('Domain=.example.com');
			},
		});
	});

	it('should redirect to root when no referer is provided', async () => {
		const { destroySession } = await import('~/server/db/session');
		(destroySession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=valid-token',
					},
					redirect: 'manual',
				});

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				// In test environment, the redirect URL includes the test handler base
				expect(location).toMatch(/\/$/); // Should end with '/'
			},
		});
	});

	it('should redirect to referer without calling destroySession when no session token', async () => {
		const { destroySession } = await import('~/server/db/session');

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						referer: 'http://localhost:3000/profile',
					},
					redirect: 'manual',
				});

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toBe('http://localhost:3000/profile');

				// Verify destroySession was NOT called
				expect(destroySession).not.toHaveBeenCalled();
			},
		});
	});

	it('should handle empty session token', async () => {
		const { destroySession } = await import('~/server/db/session');

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						referer: 'http://localhost:3000/home',
						cookie: 'session_token=',
					},
					redirect: 'manual',
				});

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toBe('http://localhost:3000/home');

				// Verify destroySession was NOT called for empty token
				expect(destroySession).not.toHaveBeenCalled();
			},
		});
	});

	it('should redirect to error page when destroySession fails', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		const { destroySession } = await import('~/server/db/session');
		(destroySession as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=valid-token',
					},
					redirect: 'manual',
				});

				expect(response.status).toBe(307);
				const location = response.headers.get('location');
				expect(location).toContain('/error/auth?error=logout_failed');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle session token with special characters', async () => {
		const { destroySession } = await import('~/server/db/session');
		(destroySession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

		const { GET } = await import('./route');

		const specialToken = 'token-with-special-chars!@#$%^&*()';

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: `session_token=${encodeURIComponent(specialToken)}`,
					},
					redirect: 'manual',
				});

				expect(response.status).toBe(307);

				// Verify destroySession was called with the decoded token
				expect(destroySession).toHaveBeenCalledWith(specialToken);
			},
		});
	});

	it('should clear session cookie with correct attributes', async () => {
		const { destroySession } = await import('~/server/db/session');
		(destroySession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/logout',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=valid-token',
					},
					redirect: 'manual',
				});

				const cookies = response.headers.getSetCookie();
				const sessionCookie = cookies.find((c) => c.startsWith('session_token='));

				expect(sessionCookie).toBeTruthy();
				expect(sessionCookie).toContain('Path=/');
				expect(sessionCookie).toContain('Domain=.example.com');
				// Should expire the cookie
				expect(sessionCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
			},
		});
	});
});
