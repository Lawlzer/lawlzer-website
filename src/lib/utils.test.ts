import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { getBaseUrl as originalGetBaseUrl } from '~/lib/utils';
import { formatFieldName } from '~/lib/utils';

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

describe('formatFieldName', () => {
	it('should convert camelCase to Title Case', () => {
		expect(formatFieldName('activeChartTab')).toBe('Active Chart Tab');
		expect(formatFieldName('maxValue')).toBe('Max Value');
		expect(formatFieldName('isLoading')).toBe('Is Loading');
		expect(formatFieldName('getData')).toBe('Get Data');
	});

	it('should convert snake_case to Title Case', () => {
		expect(formatFieldName('temperature_data')).toBe('Temperature Data');
		expect(formatFieldName('user_name')).toBe('User Name');
		expect(formatFieldName('max_allowed_value')).toBe('Max Allowed Value');
	});

	it('should convert PascalCase to Title Case', () => {
		expect(formatFieldName('DataPlatform')).toBe('Data Platform');
		expect(formatFieldName('UserProfile')).toBe('User Profile');
		expect(formatFieldName('MaxValue')).toBe('Max Value');
	});

	it('should handle consecutive uppercase letters', () => {
		expect(formatFieldName('HTTPResponse')).toBe('HTTP Response');
		expect(formatFieldName('XMLParser')).toBe('XML Parser');
		expect(formatFieldName('HTMLElement')).toBe('HTML Element');
		expect(formatFieldName('URLBuilder')).toBe('URL Builder');
		expect(formatFieldName('APIKey')).toBe('API Key');
	});

	it('should handle mixed cases', () => {
		expect(formatFieldName('getHTTPResponse')).toBe('Get HTTP Response');
		expect(formatFieldName('parseXMLData')).toBe('Parse XML Data');
		expect(formatFieldName('user_HTTPStatus')).toBe('User HTTP Status');
	});

	it('should handle edge cases', () => {
		expect(formatFieldName('')).toBe('');
		expect(formatFieldName('a')).toBe('A');
		expect(formatFieldName('A')).toBe('A');
		expect(formatFieldName('123')).toBe('123');
		expect(formatFieldName('field1')).toBe('Field1');
		expect(formatFieldName('field_1')).toBe('Field 1');
	});

	it('should handle already formatted strings', () => {
		expect(formatFieldName('Already Formatted')).toBe('Already Formatted');
		expect(formatFieldName('Has Spaces')).toBe('Has Spaces');
	});

	it('should clean up extra spaces', () => {
		expect(formatFieldName('has__double__underscores')).toBe('Has Double Underscores');
		expect(formatFieldName('  leading_spaces')).toBe('Leading Spaces');
		expect(formatFieldName('trailing_spaces  ')).toBe('Trailing Spaces');
	});

	describe('formatFieldName - UI Display Tests', () => {
		it('should format Data Platform filter field names correctly', () => {
			// Test actual field names from Data Platform
			expect(formatFieldName('activeChartTab')).toBe('Active Chart Tab');
			expect(formatFieldName('chartableFields')).toBe('Chartable Fields');
			expect(formatFieldName('commonFields')).toBe('Common Fields');
			expect(formatFieldName('availableFilters')).toBe('Available Filters');
		});

		it('should handle field names with underscores from database', () => {
			expect(formatFieldName('cattle_type')).toBe('Cattle Type');
			expect(formatFieldName('choice_grade')).toBe('Choice Grade');
			expect(formatFieldName('north_dakota')).toBe('North Dakota');
		});

		it('should format chart-related field names', () => {
			expect(formatFieldName('dataType')).toBe('Data Type');
			expect(formatFieldName('yAxisLabel')).toBe('Y Axis Label');
			expect(formatFieldName('xAxisLabel')).toBe('X Axis Label');
			expect(formatFieldName('chartTitle')).toBe('Chart Title');
			expect(formatFieldName('maxValue')).toBe('Max Value');
			expect(formatFieldName('minValue')).toBe('Min Value');
		});

		it('should handle edge cases that might break CSS', () => {
			// Empty or invalid inputs
			expect(formatFieldName('')).toBe('');
			expect(formatFieldName('   ')).toBe('');

			// Single character
			expect(formatFieldName('a')).toBe('A');
			expect(formatFieldName('A')).toBe('A');

			// Numbers
			expect(formatFieldName('field1')).toBe('Field1');
			expect(formatFieldName('field2Value')).toBe('Field2 Value');

			// Special patterns
			expect(formatFieldName('__test__')).toBe('Test');
			expect(formatFieldName('test__case')).toBe('Test Case');
			expect(formatFieldName('TEST_CASE')).toBe('TEST CASE');
		});

		it('should not break with very long field names', () => {
			const longFieldName = 'thisIsAVeryLongFieldNameThatMightAppearInSomeDataSets';
			const result = formatFieldName(longFieldName);
			expect(result).toBe('This Is A Very Long Field Name That Might Appear In Some Data Sets');
			expect(result.length).toBeGreaterThan(longFieldName.length); // Should add spaces
		});
	});
});
