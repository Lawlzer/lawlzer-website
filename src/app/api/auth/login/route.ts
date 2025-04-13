import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '~/env.mjs';

function getGoogleAuthUrl(state: string, callbackUrl: string): string {
	const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

	const options = {
		redirect_uri: `${callbackUrl}/google`,
		client_id: env.AUTH_GOOGLE_ID,
		access_type: 'offline',
		response_type: 'code',
		prompt: 'consent',
		scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(' '),
		state,
	};

	const qs = new URLSearchParams(options);

	return `${rootUrl}?${qs.toString()}`;
}

function getDiscordAuthUrl(state: string, callbackUrl: string): string {
	const rootUrl = 'https://discord.com/api/oauth2/authorize';

	const options = {
		redirect_uri: `${callbackUrl}/discord`,
		client_id: env.AUTH_DISCORD_ID,
		response_type: 'code',
		scope: 'identify email',
		state,
	};

	const qs = new URLSearchParams(options);

	return `${rootUrl}?${qs.toString()}`;
}

function getGithubAuthUrl(state: string, callbackUrl: string): string {
	const rootUrl = 'https://github.com/login/oauth/authorize';

	const options = {
		redirect_uri: `${callbackUrl}/github`,
		client_id: env.AUTH_GITHUB_ID,
		scope: 'user:email',
		state,
	};

	const qs = new URLSearchParams(options);

	return `${rootUrl}?${qs.toString()}`;
}

function getAuthorizationUrl(provider: string, state: string, callbackUrl: string): string {
	switch (provider) {
		case 'google':
			return getGoogleAuthUrl(state, callbackUrl);
		case 'discord':
			return getDiscordAuthUrl(state, callbackUrl);
		case 'github':
			return getGithubAuthUrl(state, callbackUrl);
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const searchParams = request.nextUrl.searchParams;
	const provider = searchParams.get('provider');

	if (!provider) {
		return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
	}

	// Use the configured base URL and port for the callback
	const baseUrl = env.NEXT_PUBLIC_BASE_URL;
	const port = env.NEXT_PUBLIC_FRONTEND_PORT;

	if (!baseUrl || !port) {
		console.error('NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_FRONTEND_PORT is not set in environment variables.');
		return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
	}

	// Construct the full origin with port
	const originWithPort = `${baseUrl}:${port}`;

	// Create a proper callback URL using the constructed origin
	const callbackUrl = `${originWithPort}/api/auth/callback`;

	// Create a CSRF token for security
	const state = crypto.randomUUID();

	// Set a cookie to verify the state when the user is redirected back
	const redirectUrl = getAuthorizationUrl(provider, state, callbackUrl);
	const response = NextResponse.redirect(redirectUrl);
	console.log(`redirectUrl: ${redirectUrl}`);

	console.log('Setting auth_state cookie');
	console.log('Using cookie domain:', env.NEXT_PUBLIC_COOKIE_DOMAIN);
	response.cookies.set({
		name: 'auth_state',
		value: state,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		path: '/',
		domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
	});

	response.cookies.set({
		name: 'aaa222',
		value: 'test222',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		path: '/',
		domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
	});

	return response;
}
