import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '~/env.mjs';
import type { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { handleAndGenerateSessionToken } from '~/lib/auth';
import { getBaseUrl } from '~/lib/utils';

const prisma = new PrismaClient();

interface GitHubTokenResponse {
	access_token: string;
	scope: string;
	token_type: string; // Typically "bearer"
}

interface GitHubUserInfo {
	id: number; // GitHub uses numeric IDs
	login: string; // Username
	name: string | null;
	email: string | null; // Primary email might be null, need to check /user/emails
	avatar_url: string | null;
}

// GitHub might not return the primary email in the /user endpoint if it's set to private.
// This interface represents the response from the /user/emails endpoint.
interface GitHubEmail {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: 'private' | 'public' | null;
}

async function getGitHubOAuthTokens(code: string): Promise<GitHubTokenResponse> {
	const url = 'https://github.com/login/oauth/access_token';
	const redirectUri = `${getBaseUrl()}/api/auth/callback/github`;

	const values = {
		code,
		client_id: env.NEXT_PUBLIC_AUTH_GITHUB_ID,
		client_secret: env.AUTH_GITHUB_SECRET,
		redirect_uri: redirectUri,
	};

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json', // Request JSON response
		},
		body: new URLSearchParams(values),
	});

	const data = await response.json();

	if (!response.ok || data.error) {
		console.error('GitHub Token Error:', data);
		throw new Error(data.error_description ?? data.error ?? 'Failed to get GitHub tokens');
	}

	// Check if access_token exists, sometimes GitHub returns error in JSON body even with 200 OK
	if (!data.access_token) {
		console.error('GitHub Token Error: No access_token received', data);
		throw new Error('Failed to get GitHub access token.');
	}

	return data as GitHubTokenResponse;
}

async function getGitHubUser(access_token: string): Promise<GitHubUserInfo> {
	// Get primary user info
	const userResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${access_token}`,
			Accept: 'application/vnd.github.v3+json',
		},
	});
	const userData = await userResponse.json();

	if (!userResponse.ok) {
		console.error('GitHub User Error:', userData);
		throw new Error(userData.message ?? 'Failed to get GitHub user data');
	}

	let primaryEmail = userData.email;

	// If primary email is null from /user, fetch from /user/emails
	if (!primaryEmail) {
		const emailsResponse = await fetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/vnd.github.v3+json',
			},
		});
		const emailsData = (await emailsResponse.json()) as GitHubEmail[];

		if (!emailsResponse.ok) {
			console.warn('GitHub Emails Warning:', emailsData);
			// Don't throw error, proceed without email if fetching emails fails
		} else {
			const primary = emailsData.find((email) => email.primary && email.verified);
			primaryEmail = primary?.email ?? null; // Use primary verified email if found

			// Fallback: if no primary verified email, use the first verified email
			if (!primaryEmail) {
				const firstVerified = emailsData.find((email) => email.verified);
				primaryEmail = firstVerified?.email ?? null;
			}
		}
	}

	if (!primaryEmail) {
		console.error('GitHub User Error: Could not retrieve a verified primary email for user', userData.login);
		throw new Error('Could not retrieve a verified primary email from GitHub.');
	}

	// Add the resolved email back to the user data object
	userData.email = primaryEmail;

	return userData as GitHubUserInfo;
}

async function upsertUser(githubUser: GitHubUserInfo, tokens: GitHubTokenResponse): Promise<User> {
	if (!githubUser.email) {
		// This should ideally be caught earlier in getGitHubUser
		throw new Error('Cannot upsert user without a verified email address.');
	}

	const githubAccountId = String(githubUser.id); // Convert numeric ID to string for DB

	return prisma.user.upsert({
		where: {
			email: githubUser.email,
		},
		update: {
			name: githubUser.name ?? githubUser.login, // Use login name as fallback
			image: githubUser.avatar_url,
			accounts: {
				upsert: {
					where: {
						provider_providerAccountId: {
							provider: 'github',
							providerAccountId: githubAccountId,
						},
					},
					update: {
						access_token: tokens.access_token,
						scope: tokens.scope,
						token_type: tokens.token_type,
						// GitHub tokens don't expire by default, but can be revoked.
						// No expires_at or refresh_token here unless using specific flows.
						expires_at: null,
						refresh_token: null,
					},
					create: {
						type: 'oauth',
						provider: 'github',
						providerAccountId: githubAccountId,
						access_token: tokens.access_token,
						scope: tokens.scope,
						token_type: tokens.token_type,
						expires_at: null,
						refresh_token: null,
					},
				},
			},
		},
		create: {
			email: githubUser.email,
			name: githubUser.name ?? githubUser.login,
			image: githubUser.avatar_url,
			emailVerified: new Date(), // Email fetched from /user/emails should be verified
			accounts: {
				create: {
					type: 'oauth',
					provider: 'github',
					providerAccountId: githubAccountId,
					access_token: tokens.access_token,
					scope: tokens.scope,
					token_type: tokens.token_type,
					expires_at: null,
					refresh_token: null,
				},
			},
		},
	});
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');
	const state = searchParams.get('state'); // Optional: verify state if you implemented it

	// Basic state verification example (replace with your actual state handling if needed)
	// const storedState = request.cookies.get('github_oauth_state')?.value;
	// if (!state || !storedState || state !== storedState) {
	//  console.error('GitHub state mismatch:', { received: state, expected: storedState });
	//  return NextResponse.redirect(new URL('/error/auth?error=state_mismatch', request.url));
	// }
	// Clear the state cookie after verification
	// const response = NextResponse.next();
	// response.cookies.delete('github_oauth_state');

	if (!code) {
		console.error('GitHub Callback Error: No code received.');
		return NextResponse.redirect(new URL('/error/auth?error=no_code', request.url));
	}

	try {
		// Exchange the code for tokens
		const tokens = await getGitHubOAuthTokens(code);

		// Get the user's profile information
		const githubUser = await getGitHubUser(tokens.access_token);

		// Upsert user in database
		const user = await upsertUser(githubUser, tokens);

		// Handle session creation and redirect
		return await handleAndGenerateSessionToken(user.id, request); // Pass request for potential cookie setting in handle function
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown GitHub auth error';
		console.error('Error handling GitHub callback:', error);
		// Encode error message for URL safety, though a generic error is often better for the user
		const encodedError = encodeURIComponent(errorMessage);
		// Consider redirecting to a more generic error page unless debugging
		return NextResponse.redirect(new URL(`/error/auth?error=${encodedError}`, request.url));
		// return NextResponse.redirect(new URL('/error/auth?error=server_error', request.url));
	}
}
