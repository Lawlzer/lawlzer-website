/**
 * @jest-environment node
 */

import { testApiHandler } from 'next-test-api-route-handler';
import * as handler from './route'; // Import your route handlers

describe('GET /api/valorant', () => {
	it('should return the correct message and status 200', async () => {
		await testApiHandler({
			appHandler: handler, // Use the imported handlers
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				await expect(res.json()).resolves.toEqual({
					message: 'This is the Valorant subdomain API',
				});
				expect(res.status).toBe(200);
			},
		});
	});

	it('should return the correct Content-Type header', async () => {
		await testApiHandler({
			appHandler: handler,
			test: async ({ fetch }) => {
				const res = await fetch({ method: 'GET' });
				expect(res.headers.get('content-type')).toEqual('application/json');
			},
		});
	});
});

describe('Unsupported Methods /api/valorant', () => {
	it('should return 405 for POST requests', async () => {
		await testApiHandler({
			appHandler: handler,
			// Optionally provide params, handler will resolve '/api/valorant?id=1'
			// params: { id: '1' },
			test: async ({ fetch }) => {
				const res = await fetch({
					method: 'POST',
					body: JSON.stringify({ data: 'test' }),
				});
				// next-test-api-route-handler might return 404 or 405 depending
				// on how Next.js handles undefined method handlers in this context.
				// Let's expect 405 (Method Not Allowed) as the ideal RESTful response.
				expect(res.status).toBe(405);
			},
		});
	});

	// Add similar tests for PUT, DELETE, PATCH etc. if needed
});
