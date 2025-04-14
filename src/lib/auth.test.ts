import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleAndGenerateSessionToken, getCookieDomain } from './auth';
import { createSession } from '~/server/db/session';
import { env } from '~/env.mjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('~/server/db/session', () => ({
	createSession: vi.fn(),
}));

vi.mock('next/server', () => {
	return {
		NextRequest: vi.fn(),
		NextResponse: {
			redirect: vi.fn(),
		},
	};
});

vi.mock('~/env.mjs', () => ({
	env: {
		NODE_ENV: 'test',
		NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'example',
		NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'com',
	},
}));

describe('handleAndGenerateSessionToken', () => {
	const mockUserId = 'user123';
	const mockSessionToken = 'test-session-token';
	const mockRequestUrl = 'https://example.com/login';

	let mockRequest: NextRequest;
	let mockResponse: NextResponse;
	let mockCookiesSetter: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock request
		mockRequest = {
			url: mockRequestUrl,
		} as unknown as NextRequest;

		// Mock response and cookies
		mockCookiesSetter = vi.fn();
		mockResponse = {
			cookies: {
				set: mockCookiesSetter,
			},
		} as unknown as NextResponse;

		// Setup NextResponse.redirect mock
		(NextResponse.redirect as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);

		// Setup createSession mock
		(createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
			sessionToken: mockSessionToken,
		});
	});

	it('should create a session with the provided userId', async () => {
		await handleAndGenerateSessionToken(mockUserId, mockRequest);

		expect(createSession).toHaveBeenCalledWith(mockUserId);
	});

	it('should redirect to the home page', async () => {
		await handleAndGenerateSessionToken(mockUserId, mockRequest);

		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(NextResponse.redirect).toHaveBeenCalledWith(expect.any(URL));

		// Check the URL is correct
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const mockRedirect = NextResponse.redirect as ReturnType<typeof vi.fn>;
		const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
		expect(redirectUrl.pathname).toBe('/');
	});

	it('should set the session token cookie with correct parameters', async () => {
		await handleAndGenerateSessionToken(mockUserId, mockRequest);

		const expectedCookieOptions = {
			name: 'session_token',
			value: mockSessionToken,
			httpOnly: true,
			secure: false, // NODE_ENV is 'test'
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 1 week
			path: '/',
			domain: 'example.com',
		};

		expect(mockCookiesSetter).toHaveBeenCalledWith(expectedCookieOptions);
	});

	it('should return the redirect response', async () => {
		const result = await handleAndGenerateSessionToken(mockUserId, mockRequest);

		expect(result).toBe(mockResponse);
	});
});

describe('getCookieDomain', () => {
	it('should return the correct cookie domain', () => {
		const domain = getCookieDomain();
		expect(domain).toBe('example.com');
	});
});
