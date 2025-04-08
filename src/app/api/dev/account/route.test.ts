/**
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
// Remove direct handler import, will import dynamically
// import * as handler from './route';
// We will mock env and auth, so don't import them directly here if we mock the whole module
// import { env } from '../../../../env';
// import { auth } from '../../../../server/auth';
import type { Session } from 'next-auth';

// Import the base mocked versions AFTER jest.mock calls
import { auth } from '../../../../server/auth';

// --- Mocking Setup ---
jest.mock('../../../../server/auth');
// Default mock for env, can be overridden by doMock
jest.mock('../../../../env', () => ({
	env: {
		NODE_ENV: 'production', // Default for tests where it's not specified
		AUTH_SECRET: 'mock-secret',
		AUTH_URL: 'http://localhost:3000/api/auth',
	},
}));
// env import might not be needed directly if using doMock consistently
// import { env } from '../../../../env';

// Use MockedFunction for better typing
let mockAuth = auth as jest.MockedFunction<typeof auth>; // Use let as it's reassigned in beforeEach
// --- End Mocking Setup ---

// Store original NODE_ENV - Less reliable due to module caching, mocking env directly is better
// const originalNodeEnv = process.env.NODE_ENV;

describe('GET /api/dev/account', () => {
	beforeEach(async () => {
		// Reset the auth mock
		mockAuth.mockClear();
		// Reset modules to ensure changes in doMock are picked up
		jest.resetModules();
		// Re-mock auth after resetModules to ensure it's available
		// and re-assign the global mockAuth variable using dynamic import
		jest.mock('../../../../server/auth');
		const authModule = await import('../../../../server/auth'); // Use dynamic import
		mockAuth = authModule.auth as jest.MockedFunction<typeof auth>;
	});

	afterEach(() => {
		// Important: Unmock 'env' after each test that uses doMock
		// to prevent mock state leaking between tests.
		jest.unmock('../../../../env');
	});

	// afterAll(() => {
	// Restore original NODE_ENV - Less reliable
	// process.env.NODE_ENV = originalNodeEnv;
	// });

	it('should return 403 if NODE_ENV is not development', async () => {
		// Explicitly mock env for this test's context (even if it's the default)
		jest.doMock('../../../../env', () => ({
			env: { NODE_ENV: 'production' },
		}));

		// Dynamically import the handler *after* mocks are set
		const handler = await import('./route');

		await testApiHandler({
			// We pass the actual handler, the mocks affect its dependencies
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				expect(res.status).toBe(403);
				await expect(res.json()).resolves.toEqual({
					error: 'This endpoint is only available in development mode',
				});
			},
		});
	});

	it('should return 200 and session data if NODE_ENV is development', async () => {
		// Mock env specifically for development mode in this test
		jest.doMock('../../../../env', () => ({
			env: { NODE_ENV: 'development' },
		}));

		// Dynamically import the handler *after* mocks are set
		const handler = await import('./route');
		// Use the mockAuth assigned in beforeEach
		const currentMockAuth = mockAuth;

		const mockSessionData: Session = {
			user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
			expires: '2099-01-01T00:00:00.000Z',
		};
		// Cast mock function to any before calling method
		(currentMockAuth as any).mockResolvedValue(mockSessionData);

		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				expect(res.status).toBe(200);
				await expect(res.json()).resolves.toEqual({ session: mockSessionData });
				expect(currentMockAuth).toHaveBeenCalledTimes(1); // Auth should be called only in dev mode
			},
		});
	});

	it('should return correct Content-Type header in development', async () => {
		// Mock env specifically for development mode
		jest.doMock('../../../../env', () => ({
			env: { NODE_ENV: 'development' },
		}));

		// Dynamically import the handler *after* mocks are set
		const handler = await import('./route');
		// Use the mockAuth assigned in beforeEach
		const currentMockAuth = mockAuth;

		// Session data doesn't matter, can be null
		// Cast mock function to any before calling method
		(currentMockAuth as any).mockResolvedValue(null);

		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				expect(res.headers.get('content-type')).toEqual('application/json');
			},
		});
	});

	it('should return correct Content-Type header when forbidden', async () => {
		// Mock env specifically for non-development mode
		jest.doMock('../../../../env', () => ({
			env: { NODE_ENV: 'production' },
		}));

		// Dynamically import the handler *after* mocks are set
		const handler = await import('./route');

		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				// Even on 403, the response should be JSON
				expect(res.headers.get('content-type')).toEqual('application/json');
			},
		});
	});
});

// For unsupported methods, NODE_ENV usually doesn't matter, so we might
// not need the complexity of doMock/dynamic imports here.
// Let's import the handler once for this block.
describe('Unsupported Methods /api/dev/account', () => {
	// Use 'any' type for the handler due to linter rule
	let handler: any;

	beforeAll(async () => {
		// Reset modules once before this block to ensure clean state
		jest.resetModules();
		// Mock env consistently for this block if necessary
		jest.doMock('../../../../env', () => ({
			env: { NODE_ENV: 'production' }, // Or whatever is appropriate
		}));
		// Re-mock auth after resetModules
		jest.mock('../../../../server/auth');
		handler = await import('./route');
	});

	afterAll(() => {
		// Unmock env after the block
		jest.unmock('../../../../env');
	});

	it('should return 405 for POST requests', async () => {
		await testApiHandler({
			appHandler: handler, // Use handler loaded in beforeAll
			test: async ({ fetch }) => {
				const res = await fetch({
					method: 'POST',
					body: JSON.stringify({ data: 'test' }),
				});
				// Next.js API routes typically return 405 for unsupported methods on a defined route
				expect(res.status).toBe(405);
			},
		});
	});

	// Add similar tests for PUT, DELETE, PATCH etc. if needed
	it('should return 405 for PUT requests', async () => {
		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({
					method: 'PUT',
					body: JSON.stringify({ data: 'test' }),
				});
				expect(res.status).toBe(405);
			},
		});
	});

	it('should return 405 for DELETE requests', async () => {
		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'DELETE' });
				expect(res.status).toBe(405);
			},
		});
	});

	it('should return 405 for PATCH requests', async () => {
		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({
					method: 'PATCH',
					body: JSON.stringify({ data: 'test' }),
				});
				expect(res.status).toBe(405);
			},
		});
	});
});
