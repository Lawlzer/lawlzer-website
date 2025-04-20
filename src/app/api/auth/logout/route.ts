import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { destroySession } from '~/server/db/session';
import { env } from '~/env.mjs';
import { getCookieDomain } from '~/lib/auth';
import { getBaseUrl } from '~/lib/utils';

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const sessionToken = request.cookies.get('session_token')?.value;

		// Get the referer URL to redirect back after logout
		const referer = request.headers.get('referer') ?? '/';

		if (!sessionToken) {
			return NextResponse.redirect(new URL(referer, request.url));
		}

		await destroySession(sessionToken);

		// Redirect to the referer URL instead of just the root
		const response = NextResponse.redirect(new URL(referer, request.url));

		response.cookies.set({
			name: 'session_token',
			value: '',
			expires: new Date(0),
			path: '/',
			domain: getCookieDomain(),
		});

		return response;
	} catch (error) {
		console.error('Error during logout:', error);
		return NextResponse.redirect(new URL('/error/auth?error=logout_failed', request.url));
	}
}
