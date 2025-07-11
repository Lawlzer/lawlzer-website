import type { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '~/env.mjs';
import { handleAndGenerateSessionToken } from '~/lib/auth';
import { getBaseUrl } from '~/lib/utils';

const prisma = new PrismaClient();

interface DiscordTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: string;
}

interface DiscordUserInfo {
	id: string;
	username: string;
	discriminator: string;
	avatar: string;
	email: string;
	verified: boolean;
}

async function getDiscordOAuthTokens(code: string, _request: NextRequest): Promise<DiscordTokenResponse> {
	const url = 'https://discord.com/api/oauth2/token';

	// Use the configured base URL and port for the callback
	const originWithPort = getBaseUrl(); // Uses scheme, domain, and port from env

	if (!originWithPort) {
		console.error('getBaseUrl() returned an empty or invalid value. Check environment variables (scheme, domain, port).');
		// Throw an error or handle appropriately if the base URL or port is missing
		throw new Error('Server configuration error: Could not construct origin with port.');
	}

	// Construct the redirect URI using the constructed origin
	const redirectUri = `${originWithPort}/api/auth/callback/discord`;

	const values = {
		code,
		client_id: env.NEXT_PUBLIC_AUTH_DISCORD_ID,
		client_secret: env.AUTH_DISCORD_SECRET,
		redirect_uri: redirectUri, // Use the constructed redirectUri
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
		throw new Error(data.error ?? 'Failed to get Discord tokens');
	}

	return data as DiscordTokenResponse;
}

async function getDiscordUser(access_token: string, token_type: string): Promise<DiscordUserInfo> {
	const response = await fetch('https://discord.com/api/users/@me', {
		headers: {
			Authorization: `${token_type} ${access_token}`,
		},
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error ?? 'Failed to get Discord user');
	}

	return data as DiscordUserInfo;
}

async function upsertUser(discordUser: DiscordUserInfo, tokens: DiscordTokenResponse): Promise<User> {
	const avatarUrl = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null;

	return prisma.user.upsert({
		where: {
			email: discordUser.email,
		},
		update: {
			name: discordUser.username,
			image: avatarUrl,
			discordId: discordUser.id,
			accounts: {
				upsert: {
					where: {
						provider_providerAccountId: {
							provider: 'discord',
							providerAccountId: discordUser.id,
						},
					},
					update: {
						access_token: tokens.access_token,
						expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
						refresh_token: tokens.refresh_token,
						scope: tokens.scope,
						token_type: tokens.token_type,
					},
					create: {
						type: 'oauth',
						provider: 'discord',
						providerAccountId: discordUser.id,
						access_token: tokens.access_token,
						expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
						refresh_token: tokens.refresh_token,
						scope: tokens.scope,
						token_type: tokens.token_type,
					},
				},
			},
		},
		create: {
			email: discordUser.email,
			name: discordUser.username,
			image: avatarUrl,
			discordId: discordUser.id,
			emailVerified: discordUser.verified ? new Date() : null,
			accounts: {
				create: {
					type: 'oauth',
					provider: 'discord',
					providerAccountId: discordUser.id,
					access_token: tokens.access_token,
					expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
					refresh_token: tokens.refresh_token,
					scope: tokens.scope,
					token_type: tokens.token_type,
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
		const tokens = await getDiscordOAuthTokens(code, request);
		const discordUser = await getDiscordUser(tokens.access_token, tokens.token_type);
		const user = await upsertUser(discordUser, tokens);
		return await handleAndGenerateSessionToken(user.id, request);
	} catch (error) {
		console.debug('Error handling Discord callback:', error);
		return NextResponse.redirect(new URL('/error/auth?error=server_error', request.url));
	}
}
