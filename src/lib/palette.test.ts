'use client';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_KEYS, getCookie, LIGHT_MODE_COLORS, PREDEFINED_PALETTES, setCookie } from './palette';

// --- Mocks & Setup --- //

// Mock browser environment variables
const mockWindowLocation = (hostname: string): void => {
	Object.defineProperty(window, 'location', {
		writable: true,
		value: {
			hostname: hostname,
		},
	});
};

const mockDocumentCookie = (): {
	getter: ReturnType<typeof vi.fn>;
	setter: ReturnType<typeof vi.fn>;
} => {
	const cookieStore: Record<string, string> = {};
	const getter = vi.fn(() =>
		Object.entries(cookieStore)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ')
	);
	const setter = vi.fn((value: string) => {
		const firstPart = value.split(';')[0];
		if (firstPart) {
			const parts = firstPart.split('=');
			if (parts.length >= 2) {
				const key = parts[0]?.trim();
				const val = parts.slice(1).join('=').trim();
				if (key) {
					// Handle expiration by checking for 'expires=Thu, 01 Jan 1970'
					if (value.includes('expires=Thu, 01 Jan 1970')) {
						// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
						delete cookieStore[key];
					} else {
						cookieStore[key] = val;
					}
				}
			}
		}
	});

	Object.defineProperty(document, 'cookie', {
		configurable: true, // Allow redefining the property
		get: getter,
		set: setter,
	});

	// Return the mocks and the store for manipulation/assertion
	return { getter, setter };
};

// --- Test Suite --- //

describe('Palette Library Functions', () => {
	let cookieSetterMock: ReturnType<typeof vi.fn>;
	let cookieGetterMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();

		// Mock document.cookie for each test
		const mocks = mockDocumentCookie();
		cookieGetterMock = mocks.getter;
		cookieSetterMock = mocks.setter;

		// Mock window.location for each test (default to localhost)
		mockWindowLocation('localhost');
	});

	afterEach(() => {
		// Restore mocks
		vi.restoreAllMocks();
	});

	describe('setCookie', () => {
		it('should set a cookie with name, value, and defaults', () => {
			mockWindowLocation('test.example.com'); // Use a domain for this test
			setCookie('testKey', 'testValue');
			expect(cookieSetterMock).toHaveBeenCalledTimes(1);
			// Check the cookie string format (adjust date check if needed)
			expect(cookieSetterMock).toHaveBeenCalledWith(expect.stringContaining('testKey=testValue'));
			expect(cookieSetterMock).toHaveBeenCalledWith(expect.stringContaining('path=/'));
			expect(cookieSetterMock).toHaveBeenCalledWith(expect.stringContaining('SameSite=Lax'));
			expect(cookieSetterMock).toHaveBeenCalledWith(
				expect.stringContaining('domain=example.com') // Base domain extracted
			);
			expect(cookieSetterMock).toHaveBeenCalledWith(expect.stringContaining('expires=')); // Check that expires is present
		});

		it('should not set domain for localhost', () => {
			mockWindowLocation('localhost');
			setCookie('localKey', 'localValue');
			expect(cookieSetterMock).toHaveBeenCalledTimes(1);
			expect(cookieSetterMock).toHaveBeenCalledWith(expect.stringContaining('localKey=localValue'));
			// Ensure domain attribute is NOT present
			expect(cookieSetterMock).not.toHaveBeenCalledWith(expect.stringContaining('domain='));
		});

		// TODO: Add test for error handling if needed
	});

	describe('getCookie', () => {
		beforeEach(() => {
			// Pre-populate cookie store for get tests
			document.cookie = 'existingKey=existingValue; path=/';
			document.cookie = ' anotherKey = another Value ; path=/'; // Test trimming
		});

		it('should return the value of an existing cookie', () => {
			const value = getCookie('existingKey');
			expect(value).toBe('existingValue');
			expect(cookieGetterMock).toHaveBeenCalledTimes(1);
		});

		it('should return the value of a cookie with leading spaces', () => {
			const value = getCookie('anotherKey');
			expect(value).toBe('another Value');
			expect(cookieGetterMock).toHaveBeenCalledTimes(1);
		});

		it('should return null for a non-existent cookie', () => {
			const value = getCookie('nonExistentKey');
			expect(value).toBeNull();
			expect(cookieGetterMock).toHaveBeenCalledTimes(1);
		});

		it('should return null if document is undefined (server-side)', () => {
			// Temporarily undefine document
			const originalDocument = global.document;
			// @ts-expect-error - Intentionally setting document to undefined for test
			global.document = undefined;

			const value = getCookie('anyKey');
			expect(value).toBeNull();

			// Restore document
			global.document = originalDocument;
		});

		// TODO: Add test for error handling if needed
	});

	describe('Constants', () => {
		it('COOKIE_KEYS should contain expected keys', () => {
			expect(COOKIE_KEYS).toEqual({
				PAGE_BG: 'theme_page_bg',
				PRIMARY_TEXT_COLOR: 'theme_primary_text_color',
				PRIMARY_COLOR: 'theme_primary_color',
				SECONDARY_COLOR: 'theme_secondary_color',
				SECONDARY_TEXT_COLOR: 'theme_secondary_text_color',
				BORDER_COLOR: 'theme_border_color',
			});
		});

		it('DEFAULT_COLORS should contain expected colors', () => {
			// Check against the light mode colors as the deterministic default for tests
			// Compare LIGHT_MODE_COLORS directly against the source definition
			expect(LIGHT_MODE_COLORS).toEqual(PREDEFINED_PALETTES['Light Mode']);
		});

		it('PREDEFINED_PALETTES should contain expected palettes', () => {
			// Basic check for existence and a few keys
			expect(PREDEFINED_PALETTES).toBeDefined();
			expect(PREDEFINED_PALETTES['Light Mode']).toBeDefined();
			expect(PREDEFINED_PALETTES['Dark Mode']).toBeDefined();
			expect(Object.keys(PREDEFINED_PALETTES['Light Mode'])).toEqual(expect.arrayContaining(['PAGE_BG', 'PRIMARY_TEXT_COLOR', 'PRIMARY_COLOR', 'SECONDARY_COLOR', 'SECONDARY_TEXT_COLOR', 'BORDER_COLOR']));
		});
	});
});
