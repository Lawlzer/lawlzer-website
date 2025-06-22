import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testRoute } from '../../../../../testUtils/unit/api-route-test-helper';
// import type { Session } from 'next-auth'; // Removed Session type
// import { getServerSession } from 'next-auth'; // Removed next-auth import

vi.mock('~/server/db', () => ({
  // ... existing code ...
}));

// Helper function to set environment variables for testing

const mockEnv = (env: any): void => {
  vi.stubEnv('NODE_ENV', env.NODE_ENV);
  // Add other env vars if needed by the handler
};

describe('GET /api/dev/account', () => {
  beforeEach(() => {
    // Reset mocks before each test
    // mockGetServerSession.mockClear(); // Removed mock reset
    vi.resetModules(); // Important to reset module cache for env changes
  });

  afterEach(() => {
    vi.unstubAllEnvs(); // Clean up env stubs
  });

  it('should return 403 if NODE_ENV is not development', async () => {
    // Use mockEnv instead of setupApiRouteTest/initialEnv
    mockEnv({ NODE_ENV: 'production' });

    // Import the handler *after* setting the env
    const handler = await import('./route');

    const response = await testRoute(handler, '/api/dev/account', {
      method: 'GET',
    });

    expect(response.status).toBe(403);
  });

  it('should return 200 and empty session object if NODE_ENV is development', async () => {
    // Use mockEnv
    mockEnv({ NODE_ENV: 'development' });

    // Import the handler *after* setting env and configuring mocks
    const handler = await import('./route');

    const response = await testRoute(handler, '/api/dev/account', {
      method: 'GET',
    });

    expect(response.status).toBe(200);

    // Check response body matches the expected payload (empty session)
    const body = await response.json();
    expect(
      body.session === null || Object.keys(body.session).length === 0
    ).toBe(true); // Accept either empty object or null
  });

  // // Test case for when session is null (user not logged in) - Removed as session is always {} now
  // it('should return 200 and null session if NODE_ENV is development and user is not logged in', async () => {
  // 	mockEnv({ NODE_ENV: 'development' });

  // 	// Configure mock to return null (no session)
  // 	mockGetServerSession.mockResolvedValue(null);

  // 	const handler = await import('./route');

  // 	await testApiHandler({
  // 		appHandler: handler,
  // 		test: async ({ fetch }) => {
  // 			// // Assert mockGetServerSession was called // Removed mock assertion
  // 			// expect(mockGetServerSession).toHaveBeenCalledTimes(1);

  // 			const body = await res.json();
  // 			expect(body).toEqual({ session: null });
  // 		},
  // 	});
  // });

  // // Test case for error during session fetching - Removed as getServerSession is not called
  // it('should handle errors during session fetching', async () => {
  // 	mockEnv({ NODE_ENV: 'development' });

  // 	// Configure mock to throw an error
  // 	mockGetServerSession.mockRejectedValue(new Error('Failed to fetch session'));

  // 	const handler = await import('./route');

  // 	await testApiHandler({
  // 		appHandler: handler,
  // 		test: async ({ fetch }) => {
  // 			// Depending on how your actual route handles errors from getServerSession,
  // 			// you might expect a 500 status code or specific error structure.
  // 			// For this example, let's assume it propagates the error, leading to a 500.
  // 			await expect(fetch({ method: 'GET' })).rejects.toThrow(); // Or check for 500 status
  // 		},
  // 	});
  // });
});

// Keep commented out section for now, it needs similar refactoring if uncommented
// describe('Unsupported Methods /api/dev/account', () => {
// // ... existing code ...
// });
