import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getCookieDomain } from '~/lib/auth';
import { destroySession } from '~/server/db/session';

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const sessionToken = request.cookies.get('session_token')?.value;

		// Extract only the pathname from referer to prevent open redirect attacks
		let redirectPath = '/';
		const refererHeader = request.headers.get('referer');
		if (refererHeader !== null && refererHeader !== '') {
			try {
				const refererUrl = new URL(refererHeader);
				const pathname = refererUrl.pathname.replace(/^\/\/+/, '/');
				redirectPath = pathname + refererUrl.search;
			} catch {
				redirectPath = '/';
			}
		}

		if (sessionToken === undefined || sessionToken === null || sessionToken === '') {
			return NextResponse.redirect(new URL(redirectPath, request.url));
		}

		await destroySession(sessionToken);

		const response = NextResponse.redirect(new URL(redirectPath, request.url));

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
