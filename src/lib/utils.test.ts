import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { getBaseUrl as originalGetBaseUrl } from '~/lib/utils';

describe('getBaseUrl', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	// Mock the env module
	function mockEnv(overrides: { NEXT_PUBLIC_SCHEME: string; NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: string; NEXT_PUBLIC_TOP_LEVEL_DOMAIN: string; NEXT_PUBLIC_FRONTEND_PORT: string }): void {
		const defaultEnv = {
			// Default values matching roughly the old setup
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'localhost',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: '', // Adjust if needed, maybe 'local'?
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
		};
		vi.doMock('~/env.mjs', () => ({
			env: {
				...defaultEnv,
				...overrides,
			},
		}));
	}

	// Helper function to reload the function after changing mock
	async function getReloadedBaseUrl(): Promise<typeof originalGetBaseUrl> {
		vi.resetModules();
		const { getBaseUrl } = await import('~/lib/utils');
		return getBaseUrl;
	}

	it('should handle port 80 by not including the port in the URL', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '80',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl();

		expect(result).toBe('http://example.com');
		expect(result).not.toContain(':80');
	});

	it('should include subdomain when valorant is requested', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl('valorant');

		expect(result).toBe('http://valorant.example.com:3000');
	});

	it('should correctly handle subdomain with port 80', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '80',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl('valorant');

		expect(result).toBe('http://valorant.example.com');
	});

	it('should handle subdomain with HTTPS correctly', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'https',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl('valorant');

		expect(result).toBe('https://valorant.example.com:3000');
	});

	it('should work with HTTP URLs', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl();

		expect(result).toBe('http://example.com:3000');
	});

	it('should work with HTTPS URLs', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'https',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl();

		expect(result).toBe('https://example.com:3000');
	});

	it('should work with different ports', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '8080',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl();

		expect(result).toBe('http://example.com:8080');
	});

	it('should work with localhost', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'localhost',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: '', // Assuming no TLD for localhost
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl();

		expect(result).toBe('http://localhost:3000');
	});

	it('should work with localhost and port 80', async () => {
		mockEnv({
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'localhost',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: '', // Assuming no TLD for localhost
			NEXT_PUBLIC_FRONTEND_PORT: '80',
		});

		const reloadedGetBaseUrl = await getReloadedBaseUrl();
		const result = reloadedGetBaseUrl();

		expect(result).toBe('http://localhost');
	});
});
