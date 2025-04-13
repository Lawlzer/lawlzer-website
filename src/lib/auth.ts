import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSession } from '~/server/db/session';
import { env } from '~/env.mjs';

export async function handleAndGenerateSessionToken(userId: string, request: NextRequest): Promise<NextResponse> {
	const session = await createSession(userId);

	const response = NextResponse.redirect(new URL('/', request.url));

	console.log('setting cookie for handleAndGenerateSessionToken');
	response.cookies.set({
		name: 'session_token',
		value: session.sessionToken,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7, // 1 week
		path: '/',
		domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
	});

	return response;
}
