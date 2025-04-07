import crypto from 'node:crypto';
import { serialize, parse } from 'cookie';
import type { SerializeOptions } from 'cookie';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from '../config';
import UserModel, { IUser } from '../db/models/User';
import { createSession, createSessionCookie } from './session';

const OAUTH_STATE_COOKIE_NAME = 'oauth_state';
const GOOGLE_CODE_VERIFIER_COOKIE_NAME = 'google_code_verifier';
const OAUTH_REDIRECT_URI_COOKIE_NAME = 'oauth_redirect_uri';

// --- Cookie Helpers for OAuth State/PKCE ---

const getShortLivedCookieOptions = (): SerializeOptions => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
	maxAge: 60 * 10, // 10 minutes
	sameSite: 'lax',
});

export const createStateCookie = (state: string): string => {
	return serialize(OAUTH_STATE_COOKIE_NAME, state, getShortLivedCookieOptions());
};

export const createCodeVerifierCookie = (codeVerifier: string): string => {
	return serialize(GOOGLE_CODE_VERIFIER_COOKIE_NAME, codeVerifier, getShortLivedCookieOptions());
};

export const readStateCookie = (cookieHeader: string | undefined | null): string | null => {
	if (!cookieHeader) return null;
	const cookies = parse(cookieHeader);
	return cookies[OAUTH_STATE_COOKIE_NAME] || null;
};

export const readCodeVerifierCookie = (cookieHeader: string | undefined | null): string | null => {
	if (!cookieHeader) return null;
	const cookies = parse(cookieHeader);
	return cookies[GOOGLE_CODE_VERIFIER_COOKIE_NAME] || null;
};

// New Redirect URI Cookie Helpers
export const createRedirectUriCookie = (redirectUri: string): string => {
	return serialize(OAUTH_REDIRECT_URI_COOKIE_NAME, redirectUri, getShortLivedCookieOptions());
};

export const readRedirectUriCookie = (cookieHeader: string | undefined | null): string | null => {
	if (!cookieHeader) return null;
	const cookies = parse(cookieHeader);
	return cookies[OAUTH_REDIRECT_URI_COOKIE_NAME] || null;
};

// --- PKCE Helpers ---

const generateCodeVerifier = (): string => {
	return crypto.randomBytes(32).toString('hex');
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
	return Buffer.from(digest).toString('base64url'); // Use base64url encoding
};

// --- Google OAuth ---

export const getGoogleAuthorizationUrl = async (): Promise<{ url: string; state: string; codeVerifier: string }> => {
	const state = crypto.randomBytes(16).toString('hex');
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: GOOGLE_REDIRECT_URI,
		response_type: 'code',
		scope: 'openid profile email',
		state: state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		access_type: 'offline', // Optional: request refresh token
		prompt: 'select_account', // Optional: always ask user to select account
	});

	const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	return { url, state, codeVerifier };
};

interface GoogleTokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	id_token: string; // Contains user info
	scope: string;
	token_type: string;
}

interface GoogleUserInfo {
	sub: string; // Google User ID
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	email?: string;
	email_verified?: boolean;
	locale?: string;
}

export const handleGoogleCallback = async (code: string, state: string, storedState: string | null, storedCodeVerifier: string | null): Promise<{ user: IUser; sessionCookie: string } | { error: string; status: number }> => {
	if (!state || !storedState || state !== storedState) {
		return { error: 'Invalid state parameter', status: 400 };
	}
	if (!code) {
		return { error: 'Missing code parameter', status: 400 };
	}
	if (!storedCodeVerifier) {
		return { error: 'Missing code verifier', status: 400 };
	}

	try {
		// 1. Exchange code for tokens
		const tokenParams = new URLSearchParams({
			code: code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: GOOGLE_REDIRECT_URI,
			grant_type: 'authorization_code',
			code_verifier: storedCodeVerifier,
		});

		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenParams.toString(),
		});

		if (!tokenRes.ok) {
			const errorBody = await tokenRes.text();
			console.error('Google token exchange failed:', tokenRes.status, errorBody);
			return { error: 'Failed to exchange authorization code for token', status: 500 };
		}
		const tokens: GoogleTokenResponse = await tokenRes.json();

		// 2. Fetch user info (using id_token is efficient)
		// You could also use the access_token to call the userinfo endpoint:
		// const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
		//     headers: { 'Authorization': `Bearer ${tokens.access_token}` }
		// });
		// const userInfo: GoogleUserInfo = await userInfoRes.json();

		// Decoding the ID token (basic, no signature validation shown here for brevity)
		// !!! IN PRODUCTION: You MUST validate the ID token signature using Google's public keys !!!
		const idTokenPayload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString());
		const userInfo: GoogleUserInfo = idTokenPayload;

		if (!userInfo.sub) {
			return { error: 'Failed to get user information from Google', status: 500 };
		}

		// 3. Find or create user
		let user = await UserModel.findOne({ googleId: userInfo.sub });

		if (!user) {
			// Optional: Check if a user exists with the same verified email
			// if (userInfo.email && userInfo.email_verified) {
			//     const existingByEmail = await UserModel.findOne({ email: userInfo.email });
			//     if (existingByEmail) {
			//          // Link account? Error? Your choice.
			//          // For now, we create a new user linked to Google ID
			//     }
			// }

			user = new UserModel({
				googleId: userInfo.sub,
				email: userInfo.email && userInfo.email_verified ? userInfo.email : null,
				// username is null initially, set later
			});
			await user.save();
		} else {
			// Optional: Update email if it changed and is verified
			if (userInfo.email && userInfo.email_verified && user.email !== userInfo.email) {
				user.email = userInfo.email;
				await user.save();
			}
		}

		// 4. Create session
		const session = await createSession(user.id);
		const sessionCookie = createSessionCookie(session.sessionId);

		return { user, sessionCookie };
	} catch (error) {
		console.error('Error during Google OAuth callback:', error);
		return { error: 'Internal server error during Google callback', status: 500 };
	}
};

// --- Discord OAuth ---

export const getDiscordAuthorizationUrl = (): { url: string; state: string } => {
	const state = crypto.randomBytes(16).toString('hex');

	const params = new URLSearchParams({
		client_id: DISCORD_CLIENT_ID,
		redirect_uri: DISCORD_REDIRECT_URI,
		response_type: 'code',
		scope: 'identify email', // Request necessary scopes
		state: state,
		prompt: 'consent', // Optional: force user approval screen
	});

	const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
	return { url, state };
};

interface DiscordTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
	token_type: string;
}

interface DiscordUserInfo {
	id: string; // Discord User ID
	username: string;
	discriminator: string; // The #xxxx tag
	avatar?: string;
	email?: string;
	verified?: boolean; // Email verified status
}

export const handleDiscordCallback = async (code: string, state: string, storedState: string | null): Promise<{ user: IUser; sessionCookie: string } | { error: string; status: number }> => {
	if (!state || !storedState || state !== storedState) {
		return { error: 'Invalid state parameter', status: 400 };
	}
	if (!code) {
		return { error: 'Missing code parameter', status: 400 };
	}

	try {
		// 1. Exchange code for tokens
		const tokenParams = new URLSearchParams({
			client_id: DISCORD_CLIENT_ID,
			client_secret: DISCORD_CLIENT_SECRET,
			code: code,
			grant_type: 'authorization_code',
			redirect_uri: DISCORD_REDIRECT_URI,
		});

		const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenParams.toString(),
		});

		if (!tokenRes.ok) {
			const errorBody = await tokenRes.text();
			console.error('Discord token exchange failed:', tokenRes.status, errorBody);
			return { error: 'Failed to exchange authorization code for token', status: 500 };
		}
		const tokens: DiscordTokenResponse = await tokenRes.json();

		// 2. Fetch user info
		const userInfoRes = await fetch('https://discord.com/api/users/@me', {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});

		if (!userInfoRes.ok) {
			const errorBody = await userInfoRes.text();
			console.error('Discord user info fetch failed:', userInfoRes.status, errorBody);
			return { error: 'Failed to fetch user info from Discord', status: 500 };
		}
		const userInfo: DiscordUserInfo = await userInfoRes.json();

		// 3. Find or create user
		let user = await UserModel.findOne({ discordId: userInfo.id });

		if (!user) {
			// Optional: Check if a user exists with the same verified email
			// if (userInfo.email && userInfo.verified) {
			//     const existingByEmail = await UserModel.findOne({ email: userInfo.email });
			//     // ... handle linking/error ...
			// }
			user = new UserModel({
				discordId: userInfo.id,
				email: userInfo.email && userInfo.verified ? userInfo.email : null,
			});
			await user.save();
		} else {
			// Optional: Update email if changed and verified
			if (userInfo.email && userInfo.verified && user.email !== userInfo.email) {
				user.email = userInfo.email;
				await user.save();
			}
		}

		// 4. Create session
		const session = await createSession(user.id);
		const sessionCookie = createSessionCookie(session.sessionId);

		return { user, sessionCookie };
	} catch (error) {
		console.error('Error during Discord OAuth callback:', error);
		return { error: 'Internal server error during Discord callback', status: 500 };
	}
};

// --- GitHub OAuth ---

export const getGithubAuthorizationUrl = (): { url: string; state: string } => {
	const state = crypto.randomBytes(16).toString('hex');

	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		redirect_uri: GITHUB_REDIRECT_URI,
		scope: 'read:user user:email', // Request user profile and primary email
		state: state,
	});

	const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
	return { url, state };
};

interface GithubTokenResponse {
	access_token: string;
	scope: string;
	token_type: string;
}

interface GithubUserInfo {
	id: number; // GitHub User ID is a number
	login: string; // Username
	name?: string;
	avatar_url?: string;
	// Email might be null if not public, need separate call for primary email
}

interface GithubEmailInfo {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: string | null;
}

export const handleGithubCallback = async (code: string, state: string, storedState: string | null): Promise<{ user: IUser; sessionCookie: string } | { error: string; status: number }> => {
	if (!state || !storedState || state !== storedState) {
		return { error: 'Invalid state parameter', status: 400 };
	}
	if (!code) {
		return { error: 'Missing code parameter', status: 400 };
	}

	try {
		// 1. Exchange code for access token
		const tokenParams = new URLSearchParams({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code: code,
			redirect_uri: GITHUB_REDIRECT_URI,
		});

		const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json', // Request JSON response
			},
			body: tokenParams.toString(),
		});

		if (!tokenRes.ok) {
			const errorBody = await tokenRes.text();
			console.error('GitHub token exchange failed:', tokenRes.status, errorBody);
			return { error: 'Failed to exchange authorization code for token', status: 500 };
		}
		const tokens: GithubTokenResponse = await tokenRes.json();

		// 2. Fetch user info
		const userInfoRes = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				'User-Agent': 'LawlzerApp', // GitHub API requires a User-Agent
			},
		});

		if (!userInfoRes.ok) {
			console.error('Failed to fetch GitHub user info:', userInfoRes.status);
			return { error: 'Failed to fetch user information from GitHub', status: 500 };
		}
		const userInfo: GithubUserInfo = await userInfoRes.json();
		const githubIdString = String(userInfo.id); // Convert numeric ID to string for DB consistency

		// 2.5 Fetch user emails (primary email is needed)
		let primaryEmail: string | null = null;
		const emailRes = await fetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				'User-Agent': 'LawlzerApp',
			},
		});

		if (emailRes.ok) {
			const emails: GithubEmailInfo[] = await emailRes.json();
			const primary = emails.find((e) => e.primary && e.verified);
			if (primary) {
				primaryEmail = primary.email;
			}
		} else {
			console.warn('Failed to fetch GitHub user emails:', emailRes.status);
			// Proceed without email if fetching failed
		}

		// 3. Find or create user
		let user = await UserModel.findOne({ githubId: githubIdString });

		if (!user) {
			// Optional: Check if a user exists with the same primary email
			if (primaryEmail) {
				const existingByEmail = await UserModel.findOne({ email: primaryEmail });
				if (existingByEmail) {
					// Link the GitHub account to the existing user
					console.log(`Linking GitHub ID ${githubIdString} to existing user ${existingByEmail.id} with email ${primaryEmail}`);
					existingByEmail.githubId = githubIdString;
					user = await existingByEmail.save();
				} else {
					// Create a new user
					user = new UserModel({
						githubId: githubIdString,
						email: primaryEmail,
						// username is null initially
					});
					user = await user.save();
				}
			} else {
				// Create a new user without email
				user = new UserModel({
					githubId: githubIdString,
					email: null,
					// username is null initially
				});
				user = await user.save();
			}
		} else {
			// Optional: Update email if it's available now and wasn't before, or changed
			if (primaryEmail && user.email !== primaryEmail) {
				const existingByEmail = await UserModel.findOne({ email: primaryEmail });
				// Only update email if it's not already taken by another user
				if (!existingByEmail || existingByEmail.id === user.id) {
					user.email = primaryEmail;
					user = await user.save();
				} else {
					console.warn(`Cannot update email for user ${user.id} to ${primaryEmail} as it's taken by user ${existingByEmail.id}`);
				}
			}
		}

		// 4. Create session
		const session = await createSession(user.id);
		const sessionCookie = createSessionCookie(session.sessionId);

		return { user, sessionCookie };
	} catch (error) {
		console.error('Error during GitHub OAuth callback:', error);
		return { error: 'Internal server error during GitHub callback', status: 500 };
	}
};
