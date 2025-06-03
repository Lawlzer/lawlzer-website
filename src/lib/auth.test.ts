import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { mockEnv, restoreEnv } from 'testUtils/unit/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCookieDomain, handleAndGenerateSessionToken } from './auth';

import { createSession } from '~/server/db/session';

// --- Static Mocks (Run BEFORE imports are fully resolved) ---

// Mock the env module VERY early. Use getters to read from process.env dynamically.
vi.mock('~/env', () => ({
	// Use getters to ensure the mocked env object reads the CURRENT process.env values
	// which are set by mockEnv in beforeEach.
	get env() {
		return process.env;
	},
}));

// Mock dependencies
vi.mock('~/server/db/session', () => ({
	createSession: vi.fn(),
}));

// Mock next/server correctly
vi.mock('next/server', async (importOriginal) => {
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const mod = await importOriginal<typeof import('next/server')>();
	const OriginalNextResponse = mod.NextResponse;

	// Create a mock class - we primarily need to mock static methods like redirect
	class MockNextResponse extends OriginalNextResponse {
		// Mock static methods first
		public static redirect = vi.fn();
		// Add other static mocks if necessary (e.g., json)
		// public static json = vi.fn();

		// Add explicit constructor
		public constructor(body?: BodyInit | null, init?: ResponseInit) {
			super(body, init);
			// We will mock instance methods like cookies.set *on the instance* later
		}
	}

	// Ensure other static properties/methods are carried over if not explicitly mocked
	// This handles cases like NextResponse.next() if used elsewhere
	Object.keys(OriginalNextResponse).forEach((key) => {
		if (!(key in MockNextResponse)) {
			// @ts-expect-error - Dynamically assigning static properties
			MockNextResponse[key] = OriginalNextResponse[key];
		}
	});

	return {
		...mod, // Keep original exports like NextRequest
		NextResponse: MockNextResponse as unknown as typeof mod.NextResponse, // Use the mock class, cast needed
	};
});

// --- Test Suite ---

describe('Auth Library Functions', () => {
	// Added a wrapping describe block for setup/teardown

	// --- Setup & Teardown for all tests in this file ---
	beforeEach(() => {
		vi.resetModules(); // Reset modules FIRST to ensure fresh env import
		mockEnv({
			// Define default env for these tests, can be overridden in specific describe blocks if needed
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
			NEXT_PUBLIC_FRONTEND_PORT: '3000', // Or appropriate default
			// Ensure all other required envs have defaults (as defined in testUtils/unit/utils)
		});
		vi.clearAllMocks(); // Clear mocks after setup
	});

	afterEach(() => {
		restoreEnv(); // Restore process.env
		vi.restoreAllMocks(); // Restore mocks
	});

	// --- Specific Function Tests ---

	describe('handleAndGenerateSessionToken', () => {
		const mockUserId = 'user123';
		const mockSessionToken = 'test-session-token';
		// Use scheme/domain from mockEnv
		const mockRequestUrl = `${process.env.NEXT_PUBLIC_SCHEME}://${process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN}.${process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN}/login`;
		const mockRedirectUrl = '/some-previous-page';

		let mockRequest: NextRequest;
		let mockResponse: NextResponse; // Type remains NextResponse
		let mockCookiesSetter: ReturnType<typeof vi.fn>;
		let mockCookiesGetter: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			// Specific setup for these tests
			// vi.clearAllMocks(); // Already called in outer beforeEach

			// Mock request with cookies
			mockCookiesGetter = vi.fn();
			mockRequest = {
				url: mockRequestUrl,
				cookies: {
					get: mockCookiesGetter,
				},
			} as unknown as NextRequest;

			// --- Corrected NextResponse Instantiation and Mocking ---

			// 1. Instantiate the mocked NextResponse class
			//    The mock factory ensures `new NextResponse()` uses `MockNextResponse`
			mockResponse = new NextResponse();

			// 2. Mock the 'set' method *on the cookies object of the instance*
			mockCookiesSetter = vi.fn();
			mockResponse.cookies.set = mockCookiesSetter; // Mock instance method directly

			// 3. Setup the *static* NextResponse.redirect mock
			//    Need to cast because TS doesn't know NextResponse is the mocked class here
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const redirectMock = NextResponse.redirect as ReturnType<typeof vi.fn>;
			redirectMock.mockReturnValue(mockResponse);
			// --- End Correction ---

			// Setup createSession mock
			(createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
				sessionToken: mockSessionToken,
			});
		});

		it('should create a session with the provided userId', async () => {
			await handleAndGenerateSessionToken(mockUserId, mockRequest);

			const mockedCreateSession = vi.mocked(createSession);
			expect(mockedCreateSession).toHaveBeenCalledWith(mockUserId);
		});

		it('should redirect to the base URL when no redirect cookie exists', async () => {
			// Mock cookies.get to return null for auth_redirect
			mockCookiesGetter.mockReturnValue(null);

			const result = await handleAndGenerateSessionToken(mockUserId, mockRequest);

			// Construct the expected URL string based on the mocked env
			const expectedUrl = `${process.env.NEXT_PUBLIC_SCHEME}://${process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN}.${process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN}:${process.env.NEXT_PUBLIC_FRONTEND_PORT}`;

			// eslint-disable-next-line @typescript-eslint/unbound-method
			const mockedRedirect = vi.mocked(NextResponse.redirect); // Use vi.mocked for proper typing
			expect(mockedRedirect).toHaveBeenCalledWith(expectedUrl); // Expect the string URL

			// Check the URL is correct (this check might be redundant now, but keep for clarity)

			const redirectUrlString = mockedRedirect.mock.calls[0][0] as string; // Get the string arg
			const redirectUrl = new URL(redirectUrlString); // Create URL object for checks
			expect(redirectUrl.protocol).toBe(`${process.env.NEXT_PUBLIC_SCHEME}:`);
			expect(redirectUrl.hostname).toBe(`${process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN}.${process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN}`);
			expect(redirectUrl.port).toBe(process.env.NEXT_PUBLIC_FRONTEND_PORT ?? ''); // Linter fix: Changed || to ??
			expect(redirectUrl.pathname).toBe('/');
			expect(result).toBe(mockResponse); // Check redirect returns the response
		});

		it('should redirect to the value in the redirect cookie when it exists', async () => {
			// Mock cookies.get to return a cookie with the redirect URL
			mockCookiesGetter.mockReturnValue({ value: mockRedirectUrl });

			await handleAndGenerateSessionToken(mockUserId, mockRequest);

			// eslint-disable-next-line @typescript-eslint/unbound-method
			const mockedRedirect = vi.mocked(NextResponse.redirect); // Use vi.mocked for proper typing
			expect(mockedRedirect).toHaveBeenCalledWith(mockRedirectUrl);
		});

		it('should clear the redirect cookie when it exists', async () => {
			// Mock cookies.get to return a cookie with the redirect URL
			mockCookiesGetter.mockReturnValue({ value: mockRedirectUrl });

			await handleAndGenerateSessionToken(mockUserId, mockRequest);

			// Check if the cookie was cleared (set with empty value and 0 maxAge)
			expect(mockCookiesSetter).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'auth_redirect',
					value: '',
					maxAge: 0,
				})
			);
		});

		it('should set the session token cookie with correct parameters', async () => {
			await handleAndGenerateSessionToken(mockUserId, mockRequest);

			const expectedCookieOptions = {
				name: 'session_token',
				value: mockSessionToken,
				httpOnly: true,
				secure: process.env.NODE_ENV !== 'test', // Should be false in test env
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7, // 1 week
				path: '/',
				domain: `${process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN}.${process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN}`, // Use mocked domain
			};

			// Check if the setter was called with an object containing the expected options
			expect(mockCookiesSetter).toHaveBeenCalledWith(expect.objectContaining(expectedCookieOptions));
			// Also check the full call signature if needed (e.g., if the function takes name/value separately)
			// expect(mockCookiesSetter).toHaveBeenCalledWith(expectedCookieOptions.name, expectedCookieOptions.value, expect.objectContaining(expectedCookieOptions)); // Adjust if needed
		});

		it('should return the redirect response', async () => {
			const result = await handleAndGenerateSessionToken(mockUserId, mockRequest);

			expect(result).toBe(mockResponse);
		});
	}); // End describe handleAndGenerateSessionToken

	describe('getCookieDomain', () => {
		// beforeEach for getCookieDomain if specific env needed, otherwise uses outer beforeEach env
		it('should return the correct cookie domain based on mocked env', () => {
			// Ensure env is mocked correctly before calling
			const domain = getCookieDomain();
			expect(domain).toBe(`${process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN}.${process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN}`);
		});
	}); // End describe getCookieDomain
}); // End wrapping describe block
