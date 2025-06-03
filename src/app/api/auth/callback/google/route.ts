import type { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '~/env.mjs';
import { handleAndGenerateSessionToken } from '~/lib/auth';
import { getBaseUrl } from '~/lib/utils';

const prisma = new PrismaClient();

interface GoogleTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
	id_token: string;
}

interface GoogleUserInfo {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
}

async function getGoogleOAuthTokens(code: string, _request: NextRequest): Promise<GoogleTokenResponse> {
	const url = 'https://oauth2.googleapis.com/token';

	const originWithPort = getBaseUrl();

	if (!originWithPort) {
		console.error('getBaseUrl() returned an empty or invalid value. Check environment variables (scheme, domain, port).');
		throw new Error('Server configuration error: Could not construct origin with port.');
	}

	const redirectUri = `${originWithPort}/api/auth/callback/google`;

	const values = {
		code,
		client_id: env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
		client_secret: env.AUTH_GOOGLE_SECRET,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
	};

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams(values),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error ?? 'Failed to get Google tokens');
	}

	return data as GoogleTokenResponse;
}

async function getGoogleUser(access_token: string): Promise<GoogleUserInfo> {
	const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error ?? 'Failed to get Google user');
	}

	return data as GoogleUserInfo;
}

async function upsertUser(googleUser: GoogleUserInfo, tokens: GoogleTokenResponse): Promise<User> {
	return prisma.user.upsert({
		where: {
			email: googleUser.email,
		},
		update: {
			name: googleUser.name,
			image: googleUser.picture,
			accounts: {
				upsert: {
					where: {
						provider_providerAccountId: {
							provider: 'google',
							providerAccountId: googleUser.id,
						},
					},
					update: {
						access_token: tokens.access_token,
						expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
						refresh_token: tokens.refresh_token,
						id_token: tokens.id_token,
						scope: tokens.scope,
						token_type: 'Bearer',
					},
					create: {
						type: 'oauth',
						provider: 'google',
						providerAccountId: googleUser.id,
						access_token: tokens.access_token,
						expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
						refresh_token: tokens.refresh_token,
						id_token: tokens.id_token,
						scope: tokens.scope,
						token_type: 'Bearer',
					},
				},
			},
		},
		create: {
			email: googleUser.email,
			name: googleUser.name,
			image: googleUser.picture,
			emailVerified: googleUser.verified_email ? new Date() : null,
			accounts: {
				create: {
					type: 'oauth',
					provider: 'google',
					providerAccountId: googleUser.id,
					access_token: tokens.access_token,
					expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
					refresh_token: tokens.refresh_token,
					id_token: tokens.id_token,
					scope: tokens.scope,
					token_type: 'Bearer',
				},
			},
		},
	});
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams } = request.nextUrl;
	const code = searchParams.get('code');

	if (code === null || code === '') {
		return NextResponse.redirect(new URL('/error/auth?error=no_code', request.url));
	}

	try {
		// Exchange the code for tokens
		const tokens = await getGoogleOAuthTokens(code, request);

		// Get the user's profile information
		const googleUser = await getGoogleUser(tokens.access_token);

		// Upsert user in database
		const user = await upsertUser(googleUser, tokens);

		// Call the new utility function to handle session and response
		return await handleAndGenerateSessionToken(user.id, request);
	} catch (error) {
		console.debug('Error handling Google callback:', error);
		return NextResponse.redirect(new URL('/error/auth?error=server_error', request.url));
	}
}
