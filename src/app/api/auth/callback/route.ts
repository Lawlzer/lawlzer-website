import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '~/env.mjs';

export async function GET(request: NextRequest): Promise<NextResponse> {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');
	const state = searchParams.get('state');
	const error = searchParams.get('error');

	// Get the saved state from the cookies for verification
	const savedState = request.cookies.get('auth_state')?.value;

	// Check if there was an error or if the state doesn't match
	if (error) {
		return NextResponse.redirect(new URL(`/error/auth?error=${error}`, request.url));
	}

	if (!code || !state || !savedState || state !== savedState) {
		return NextResponse.redirect(new URL('/error/auth?error=invalid_state', request.url));
	}

	// Determine which provider callback to use based on the path
	const url = new URL(request.url);
	const path = url.pathname.split('/');
	const provider = path[path.length - 1];

	// Clear the state cookie
	const response = NextResponse.redirect(new URL(`/api/auth/callback/${provider}`, request.url));
	console.log('returning cookie smiles');
	response.cookies.set({
		name: 'auth_state',
		value: '',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
		domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
	});

	response.cookies.set({
		name: 'aaa111',
		value: 'test',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		path: '/',
		domain: '.test',
	});

	console.log('\n\n\naaa\n\n\n');

	return response;
}
