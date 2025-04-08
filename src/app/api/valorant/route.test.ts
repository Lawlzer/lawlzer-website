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
