/**
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as handler from './route'; // Import your route handlers
// We will mock env and auth, so don't import them directly here if we mock the whole module
// import { env } from '../../../../env';
// import { auth } from '../../../../server/auth';
import type { Session } from 'next-auth';

// Import the mocked versions AFTER setting up the mocks
// Now that the modules are mocked, these imports will get the mocked versions.
import { auth } from '../../../../server/auth';
import { env } from '../../../../env';

// --- Mocking Setup ---
// Mock the entire auth module
jest.mock('../../../../server/auth');
// Mock the entire env module, providing a factory to ensure structure
jest.mock('../../../../env', () => ({
	env: {
		NODE_ENV: 'production', // Default value for tests
		// Add other required env variables with mock values if necessary
		AUTH_SECRET: 'mock-secret',
		AUTH_URL: 'http://localhost:3000/api/auth',
		// ... other env vars
	},
}));

// Assign the mocked imports to const variables
// We use 'as jest.Mock' to tell TypeScript this is indeed a Jest mock
const mockAuth = auth as jest.Mock<Promise<Session | null>>;
// The mock factory ensures env exists with the correct structure
const mockEnv = { env };
// --- End Mocking Setup ---

// Use beforeAll *after* declarations - Removed as it's better inside describe
// beforeAll(() => {
//     // No dynamic imports needed here anymore
// });

// Store original NODE_ENV - Less reliable due to module caching, mocking env directly is better
// const originalNodeEnv = process.env.NODE_ENV;

describe('GET /api/dev/account', () => {
	// beforeAll can go here if setup applies to all tests in this describe block

	beforeEach(() => {
		// Reset mocks before each test
		mockAuth.mockClear();
		// Reset the NODE_ENV mock to a default (e.g., 'production') before each test
		// Ensure env and env.NODE_ENV exist in the mock - No longer needed due to factory
		// if (!mockEnv.env) {
		//     mockEnv.env = { NODE_ENV: 'production' };
		// } else {
		//     mockEnv.env.NODE_ENV = 'production';
		// }
		// Reset NODE_ENV to the default 'production' before each test
		mockEnv.env.NODE_ENV = 'production';
	});

	// afterAll(() => {
	// Restore original NODE_ENV - Less reliable
	// process.env.NODE_ENV = originalNodeEnv;
	// });

	it('should return 403 if NODE_ENV is not development', async () => {
		// Ensure NODE_ENV is 'production' - Handled by beforeEach
		// mockEnv.env.NODE_ENV = 'production';
		// NODE_ENV is 'production' by default from beforeEach

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
		// Set NODE_ENV to 'development' specifically for this test
		mockEnv.env.NODE_ENV = 'development';

		const mockSessionData: Session = {
			user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
			expires: '2099-01-01T00:00:00.000Z',
		};
		// Ensure the mock resolves with the correct type
		mockAuth.mockResolvedValue(mockSessionData);

		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				expect(res.status).toBe(200);
				await expect(res.json()).resolves.toEqual({ session: mockSessionData });
				expect(mockAuth).toHaveBeenCalledTimes(1);
			},
		});
	});

	it('should return correct Content-Type header in development', async () => {
		// Set NODE_ENV to 'development' specifically for this test
		mockEnv.env.NODE_ENV = 'development';

		// Session data doesn't matter, can be null
		mockAuth.mockResolvedValue(null);

		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				expect(res.headers.get('content-type')).toEqual('application/json');
			},
		});
	});

	it('should return correct Content-Type header when forbidden', async () => {
		// Ensure NODE_ENV is not 'development'
		// mockEnv.env.NODE_ENV = 'production'; // Already set by beforeEach
		// Ensure NODE_ENV is not 'development' (it's 'production' by default)
		// mockEnv.env.NODE_ENV = 'production'; // Already set by beforeEach

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

describe('Unsupported Methods /api/dev/account', () => {
	// Set NODE_ENV for these tests - No longer needed
	// beforeAll(() => {
	//     if (!mockEnv.env) {
	//         mockEnv.env = { NODE_ENV: 'production' };
	//     } else {
	//         mockEnv.env.NODE_ENV = 'production'; // Or 'development', shouldn't matter for method check
	//     }
	// });
	// You could use beforeAll here if you needed specific setup for this block
	// beforeAll(() => {
	//     mockEnv.env.NODE_ENV = 'production'; // Set desired env for all these tests
	// });

	it('should return 405 for POST requests', async () => {
		await testApiHandler({
			appHandler: handler,
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
