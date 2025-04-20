import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSession } from '~/server/db/session';
import { env } from '~/env.mjs';
import { getBaseUrl } from '~/lib/utils';

export function getCookieDomain(): string {
	return `${env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN}.${env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN}`;
}

export async function handleAndGenerateSessionToken(userId: string, request: NextRequest): Promise<NextResponse> {
	const session = await createSession(userId);

	// Get the redirect URL from the auth_redirect cookie if available
	const redirectCookie = request.cookies.get('auth_redirect');
	// Default to the base URL if no redirect cookie is found
	const redirectUrl = redirectCookie?.value ?? getBaseUrl();

	const response = NextResponse.redirect(redirectUrl);

	// Set the session token cookie
	response.cookies.set({
		name: 'session_token',
		value: session.sessionToken,
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7, // 1 week
		path: '/',
		domain: getCookieDomain(),
	});

	// Clear the auth_redirect cookie
	if (redirectCookie) {
		response.cookies.set({
			name: 'auth_redirect',
			value: '',
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0, // Delete immediately
			path: '/',
			domain: getCookieDomain(),
		});
	}

	return response;
}
