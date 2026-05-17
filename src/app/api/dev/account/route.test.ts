import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('GET /api/dev/account', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should return 403 if NODE_ENV is not development', async () => {
		vi.stubEnv('NODE_ENV', 'production');

		const { GET } = await import('./route');

		const request = new NextRequest('http://localhost:3000/api/dev/account');
		const response = await GET(request);

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error).toBeDefined();
	});

	it('should return 200 and session object if NODE_ENV is development', async () => {
		vi.stubEnv('NODE_ENV', 'development');

		const { GET } = await import('./route');

		const request = new NextRequest('http://localhost:3000/api/dev/account');
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toHaveProperty('session');
	});
});
