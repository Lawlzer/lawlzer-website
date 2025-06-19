import { testApiHandler } from 'next-test-api-route-handler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock session module
vi.mock('~/server/db/session', () => ({
	getSessionDataByToken: vi.fn(),
}));

describe('/api/auth/session', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should return session data for valid session token', async () => {
		const mockSessionData = {
			id: 'session-id',
			userId: 'user-id',
			email: 'test@example.com',
			name: 'Test User',
			image: 'https://example.com/avatar.jpg',
			expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
		};

		const { getSessionDataByToken } = await import('~/server/db/session');
		(getSessionDataByToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessionData);

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=valid-token',
					},
				});

				expect(response.status).toBe(200);
				const data = await response.json();

				// Check the response contains the session data
				expect(data).toEqual({
					id: 'session-id',
					userId: 'user-id',
					email: 'test@example.com',
					name: 'Test User',
					image: 'https://example.com/avatar.jpg',
					expiresAt: mockSessionData.expiresAt.toISOString(),
				});

				// Verify getSessionDataByToken was called with the token
				expect(getSessionDataByToken).toHaveBeenCalledWith('valid-token');
			},
		});
	});

	it('should return null when no session token is provided', async () => {
		const { getSessionDataByToken } = await import('~/server/db/session');

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
				});

				expect(response.status).toBe(200);
				const data = await response.json();
				expect(data).toBeNull();

				// Verify getSessionDataByToken was NOT called
				expect(getSessionDataByToken).not.toHaveBeenCalled();
			},
		});
	});

	it('should return null for empty session token', async () => {
		const { getSessionDataByToken } = await import('~/server/db/session');

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=',
					},
				});

				expect(response.status).toBe(200);
				const data = await response.json();
				expect(data).toBeNull();

				// Verify getSessionDataByToken was NOT called
				expect(getSessionDataByToken).not.toHaveBeenCalled();
			},
		});
	});

	it('should return null when session is not found', async () => {
		const { getSessionDataByToken } = await import('~/server/db/session');
		(getSessionDataByToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=invalid-token',
					},
				});

				expect(response.status).toBe(200);
				const data = await response.json();
				expect(data).toBeNull();

				// Verify getSessionDataByToken was called
				expect(getSessionDataByToken).toHaveBeenCalledWith('invalid-token');
			},
		});
	});

	it('should handle expired sessions', async () => {
		const _mockExpiredSessionData = {
			id: 'session-id',
			userId: 'user-id',
			email: 'test@example.com',
			name: 'Test User',
			image: null,
			expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
		};

		const { getSessionDataByToken } = await import('~/server/db/session');
		// getSessionDataByToken should return null for expired sessions
		(getSessionDataByToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=expired-token',
					},
				});

				expect(response.status).toBe(200);
				const data = await response.json();
				expect(data).toBeNull();
			},
		});
	});

	it('should handle database errors gracefully', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		const { getSessionDataByToken } = await import('~/server/db/session');
		(getSessionDataByToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database connection failed'));

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=valid-token',
					},
				});

				expect(response.status).toBe(500);
				const data = await response.json();
				expect(data).toEqual({ error: 'Internal Server Error' });
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle session tokens with special characters', async () => {
		const mockSessionData = {
			id: 'session-id',
			userId: 'user-id',
			email: 'test@example.com',
			name: 'Test User',
			image: null,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60),
		};

		const { getSessionDataByToken } = await import('~/server/db/session');
		(getSessionDataByToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessionData);

		const { GET } = await import('./route');

		const specialToken = 'token-with-special-chars!@#$%^&*()';

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: `session_token=${encodeURIComponent(specialToken)}`,
					},
				});

				expect(response.status).toBe(200);
				const data = await response.json();
				expect(data).toBeTruthy();

				// Verify getSessionDataByToken was called with the decoded token
				expect(getSessionDataByToken).toHaveBeenCalledWith(specialToken);
			},
		});
	});

	it('should handle null session token value', async () => {
		const { getSessionDataByToken } = await import('~/server/db/session');

		const { GET } = await import('./route');

		await testApiHandler({
			appHandler: { GET } as any,
			url: '/api/auth/session',
			test: async ({ fetch }) => {
				const response = await fetch({
					method: 'GET',
					headers: {
						cookie: 'session_token=null',
					},
				});

				expect(response.status).toBe(200);
				const _data = await response.json();

				// The string "null" should be treated as a valid token value
				expect(getSessionDataByToken).toHaveBeenCalledWith('null');
			},
		});
	});
});
