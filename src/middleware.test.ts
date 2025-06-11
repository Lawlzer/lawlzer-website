import type { NextRequest } from 'next/server';
import type { ConsoleMock } from 'testUtils/unit/console.helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from './env.mjs';
import { middleware } from './middleware';

// Mock Next.js server dependencies
vi.mock('next/server', () => ({
	NextRequest: vi.fn(),
	NextResponse: {
		next: vi.fn(() => ({ type: 'next' })),
		redirect: vi.fn((url) => ({ type: 'redirect', url: url.toString() })),
		rewrite: vi.fn((url) => ({ type: 'rewrite', url: url.toString() })),
	},
}));

// Mock utils
vi.mock('./lib/utils', () => ({
	getBaseUrl: vi.fn((subdomain?: string) => {
		if (subdomain === 'colors') return 'http://colors.dev.localhost:3000';
		if (subdomain === 'valorant') return 'http://valorant.dev.localhost:3000';
		return 'http://dev.localhost:3000';
	}),
	subdomains: [
		{ name: 'colors', filePath: '/subdomains/colors' },
		{ name: 'valorant', filePath: '/subdomains/valorant' },
	],
}));

// Mock env
vi.mock('./env.mjs', () => ({
	env: {
		NODE_ENV: 'development',
		DEBUG_SUBDOMAIN_VALUE: false,
	},
}));

// Helper function to create mock NextRequest
function createMockRequest(url: string, headers: Record<string, string> = {}) {
	const urlObj = new URL(url);
	return {
		url,
		nextUrl: {
			clone: () => urlObj,
			pathname: urlObj.pathname,
			hostname: urlObj.hostname,
		},
		headers: {
			get: (name: string) => headers[name] || null,
		},
	} as unknown as NextRequest;
}

describe('middleware', () => {
	let consoleMock: ConsoleMock;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Reset console mocks
		const { mockConsoleDebug } = await import('testUtils/unit/console.helpers');
		consoleMock = mockConsoleDebug();
	});

	afterEach(() => {
		consoleMock.restore();
		vi.restoreAllMocks();
	});

	describe('Development Redirects', () => {
		it('should redirect from localhost to configured domain in development', () => {
			const request = createMockRequest('http://localhost:3000/test-path', {
				host: 'localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'redirect',
				url: 'http://dev.localhost:3000/test-path',
			});
		});

		it('should not redirect in production', () => {
			// Change env to production
			(env as any).NODE_ENV = 'production';

			const request = createMockRequest('http://localhost:3000/test-path', {
				host: 'localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({ type: 'rewrite', url: 'http://localhost:3000/subdomains/root/test-path' });

			// Reset env
			(env as any).NODE_ENV = 'development';
		});
	});

	describe('Subdomain Routing', () => {
		it('should rewrite colors subdomain root to colors path', () => {
			const request = createMockRequest('http://colors.dev.localhost:3000/', {
				host: 'colors.dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://colors.dev.localhost:3000/subdomains/colors',
			});
		});

		it('should rewrite valorant subdomain root to valorant path', () => {
			const request = createMockRequest('http://valorant.dev.localhost:3000/', {
				host: 'valorant.dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://valorant.dev.localhost:3000/subdomains/valorant',
			});
		});

		it('should pass through _next paths on subdomains', () => {
			const request = createMockRequest('http://colors.dev.localhost:3000/_next/static/chunk.js', {
				host: 'colors.dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({ type: 'next' });
		});

		it('should rewrite non-root paths on subdomains', () => {
			const request = createMockRequest('http://colors.dev.localhost:3000/about', {
				host: 'colors.dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://colors.dev.localhost:3000/about',
			});
		});
	});

	describe('Main Domain Routing', () => {
		it('should rewrite main domain paths to root subdomain', () => {
			const request = createMockRequest('http://dev.localhost:3000/about', {
				host: 'dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://dev.localhost:3000/subdomains/root/about',
			});
		});

		it('should handle localhost as main domain', () => {
			// Skip the development redirect by setting NODE_ENV to production
			(env as any).NODE_ENV = 'production';

			const request = createMockRequest('http://localhost:3000/test', {
				host: 'localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://localhost:3000/subdomains/root/test',
			});

			// Reset env
			(env as any).NODE_ENV = 'development';
		});

		it('should handle 127.0.0.1 as main domain', () => {
			const request = createMockRequest('http://127.0.0.1:3000/page', {
				host: '127.0.0.1:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://127.0.0.1:3000/subdomains/root/page',
			});
		});
	});

	describe('Header Handling', () => {
		it('should prioritize x-forwarded-host over host header', () => {
			const request = createMockRequest('http://internal.domain:3000/', {
				host: 'internal.domain:3000',
				'x-forwarded-host': 'colors.dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://internal.domain:3000/subdomains/colors',
			});
		});

		it('should handle missing headers gracefully', () => {
			const request = createMockRequest('http://unknown.domain:3000/test');

			const response = middleware(request);

			// Should pass through as no domain matched
			expect(response).toEqual({ type: 'next' });
		});

		it('should strip port from hostname for comparison', () => {
			const request = createMockRequest('http://colors.dev.localhost:8080/', {
				host: 'colors.dev.localhost:8080',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://colors.dev.localhost:8080/subdomains/colors',
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle root path on main domain', () => {
			const request = createMockRequest('http://dev.localhost:3000/', {
				host: 'dev.localhost:3000',
			});

			const response = middleware(request);

			expect(response).toEqual({
				type: 'rewrite',
				url: 'http://dev.localhost:3000/subdomains/root/',
			});
		});

		it('should pass through unmatched domains', () => {
			const request = createMockRequest('http://unknown.domain.com/test', {
				host: 'unknown.domain.com',
			});

			const response = middleware(request);

			expect(response).toEqual({ type: 'next' });
		});
	});

	describe('Debug Mode', () => {
		it('should log debug messages when DEBUG_SUBDOMAIN_VALUE is true', () => {
			(env as any).DEBUG_SUBDOMAIN_VALUE = true;

			const request = createMockRequest('http://colors.dev.localhost:3000/', {
				host: 'colors.dev.localhost:3000',
			});

			middleware(request);

			expect(consoleMock.spy).toHaveBeenCalledWith('[Middleware] Running middleware for:', 'http://colors.dev.localhost:3000/');
			expect(consoleMock.spy).toHaveBeenCalledWith('[Middleware] Detected hostname: colors.dev.localhost');

			(env as any).DEBUG_SUBDOMAIN_VALUE = false;
		});
	});
});
