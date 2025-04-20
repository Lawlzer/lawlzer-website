import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '~/env.mjs';
import { getCookieDomain } from '~/lib/auth';
import { getBaseUrl } from '~/lib/utils';

function getGoogleAuthUrl(state: string, callbackUrl: string): string {
	const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

	const options = {
		redirect_uri: `${callbackUrl}/google`,
		client_id: env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
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
		client_id: env.NEXT_PUBLIC_AUTH_DISCORD_ID,
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
		client_id: env.NEXT_PUBLIC_AUTH_GITHUB_ID,
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
	const originWithPort = getBaseUrl();

	if (!originWithPort) {
		console.error('getBaseUrl() returned an empty or invalid value. Check environment variables (scheme, domain, port).');
		return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
	}

	// Create a proper callback URL using the constructed origin
	const callbackUrl = `${originWithPort}/api/auth/callback`;

	// Create a CSRF token for security
	const state = crypto.randomUUID();

	// Get the referer URL to redirect back after login
	const referer = request.headers.get('referer') ?? '/';

	// Set a cookie to verify the state when the user is redirected back
	const redirectUrl = getAuthorizationUrl(provider, state, callbackUrl);
	const response = NextResponse.redirect(redirectUrl);

	// Store the referrer URL in a cookie to redirect back after successful login
	response.cookies.set({
		name: 'auth_redirect',
		value: referer,
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		path: '/',
		domain: getCookieDomain(),
	});

	response.cookies.set({
		name: 'auth_state',
		value: state,
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		path: '/',
		domain: getCookieDomain(),
	});

	response.cookies.set({
		name: 'aaa222',
		value: 'test222',
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		path: '/',
		domain: getCookieDomain(),
	});

	return response;
}
