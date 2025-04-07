import { Elysia, t, NotFoundError, type Context } from 'elysia';
import UserModel, { IUser } from '../db/models/User';
import { z } from 'zod';
import { serialize } from 'cookie'; // Import serialize
import {
	createStateCookie,
	createCodeVerifierCookie,
	createRedirectUriCookie, // Import new helper
	readStateCookie,
	readCodeVerifierCookie,
	readRedirectUriCookie, // Import new helper
	getGoogleAuthorizationUrl,
	handleGoogleCallback as processGoogleCallback,
	getDiscordAuthorizationUrl,
	handleDiscordCallback as processDiscordCallback,
	getGithubAuthorizationUrl,
	handleGithubCallback as processGithubCallback, // Import GitHub functions
} from './oauth'; // Import custom OAuth functions
import { readSessionCookie, invalidateSession, createBlankSessionCookie } from './session'; // Import custom session functions
import { PRODUCTION } from '../config'; // Import PRODUCTION
import { createHtmlResponse } from '../utils/html'; // Import createHtmlResponse
import type { UrlConfig, AppContext } from '../types'; // Import AppContext (and UrlConfig)
import type { CustomAuthContext } from '../middleware/luciaAuth'; // Import custom context type

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

// --- Route Handlers (Rewritten) ---

// GET /login & /register
export const handleLoginGet = async (context: any) => {
	console.log('[Handler handleLoginGet] Executing...');
	const { navUrls, user, session } = context;

	if (!navUrls) {
		console.error('[Handler handleLoginGet] navUrls not found!');
		if (context.set) context.set.status = 500;
		return 'Internal Server Error: Missing navigation configuration.';
	}

	const loginContent = `
        <style>
            .provider-button {
                display: inline-flex;
                align-items: center;
                padding: 10px 15px;
                border: 1px solid #ccc;
                border-radius: 5px;
                text-decoration: none;
                color: #333;
                font-size: 16px;
                cursor: pointer;
                margin: 5px;
                background-color: #f8f8f8;
            }
            .provider-button:hover {
                background-color: #eee;
            }
            .provider-button img {
                width: 24px;
                height: 24px;
                margin-right: 10px;
            }
        </style>
        <p>Choose a provider:</p>
        <a href="/login/google" class="provider-button">
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" />
            <span>Login with Google</span>
        </a>
        <br/>
        <a href="/login/discord" class="provider-button">
            <img src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a6ca814282eca7172c6_icon_clyde_blurple_RGB.svg" alt="Discord logo" />
            <span>Login with Discord</span>
        </a>
        <br/>
        <a href="/login/github" class="provider-button">
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub logo" />
            <span>Login with GitHub</span>
        </a>
    `;

	return createHtmlResponse('Login / Register', loginContent, navUrls, { user, session });
};
export const handleRegisterGet = handleLoginGet;

// GET /login/google
export const handleGoogleLogin = async ({ set, headers }: any) => {
	// Add headers to context
	const { url, state, codeVerifier } = await getGoogleAuthorizationUrl();

	// Get Referer for redirect
	const referer = headers.referer || '/'; // Fallback to home page

	// Create cookie strings
	const stateCookie = createStateCookie(state);
	const codeVerifierCookie = createCodeVerifierCookie(codeVerifier);
	const redirectUriCookie = createRedirectUriCookie(referer); // Create redirect URI cookie

	// Prepare headers for the redirect response
	const responseHeaders = new Headers(); // Use a different name to avoid conflict
	responseHeaders.append('Set-Cookie', stateCookie);
	responseHeaders.append('Set-Cookie', codeVerifierCookie);
	responseHeaders.append('Set-Cookie', redirectUriCookie); // Add redirect URI cookie

	// Merge with existing Set-Cookie headers if necessary
	const existingSetCookie = set.headers['Set-Cookie'];
	if (existingSetCookie) {
		if (Array.isArray(existingSetCookie)) {
			existingSetCookie.forEach((c) => {
				responseHeaders.append('Set-Cookie', c);
			});
		} else {
			responseHeaders.append('Set-Cookie', existingSetCookie);
		}
	}

	// Set the Location header for the redirect
	responseHeaders.set('Location', url);

	// Return a Response object for the redirect
	return new Response(null, {
		status: 302,
		headers: responseHeaders, // Pass the Headers object directly
		statusText: 'Found', // Optional: Status text
	});
};

// GET /login/google/callback
export const handleGoogleCallback = async ({ query, set, headers }: any) => {
	console.log('[Handler handleGoogleCallback] Executing...');
	const code = query.code as string;
	const state = query.state as string;

	const storedState = readStateCookie(headers.cookie);
	const storedCodeVerifier = readCodeVerifierCookie(headers.cookie);
	const redirectUri = readRedirectUriCookie(headers.cookie) || '/';

	const clearStateCookie = serialize('oauth_state', '', { maxAge: 0, path: '/' });
	const clearVerifierCookie = serialize('google_code_verifier', '', { maxAge: 0, path: '/' });
	const clearRedirectUriCookie = serialize('oauth_redirect_uri', '', { maxAge: 0, path: '/' });
	try {
		const result = await processGoogleCallback(code, state, storedState, storedCodeVerifier);

		if ('error' in result) {
			set.status = result.status;
			const errorHeaders = new Headers();
			errorHeaders.append('Set-Cookie', clearStateCookie);
			errorHeaders.append('Set-Cookie', clearVerifierCookie);
			errorHeaders.append('Set-Cookie', clearRedirectUriCookie);
			set.headers = errorHeaders;
			console.error(`[Handler handleGoogleCallback] Google Login Error - ${result.error}, Status: ${result.status}`);
			return `Google Login Error: ${result.error}`;
		}

		const targetRedirect = result.user.username ? redirectUri : '/setup-account';
		const responseHeaders = new Headers();
		responseHeaders.append('Set-Cookie', result.sessionCookie);
		responseHeaders.append('Set-Cookie', clearStateCookie);
		responseHeaders.append('Set-Cookie', clearVerifierCookie);
		responseHeaders.append('Set-Cookie', clearRedirectUriCookie);
		responseHeaders.set('Location', targetRedirect);
		set.redirect = null;
		return new Response(null, { status: 302, headers: responseHeaders });
	} catch (error) {
		console.error('[Handler handleGoogleCallback] Unexpected error', error);
		const errorHeaders = new Headers();
		errorHeaders.append('Set-Cookie', clearStateCookie);
		errorHeaders.append('Set-Cookie', clearVerifierCookie);
		errorHeaders.append('Set-Cookie', clearRedirectUriCookie);
		set.headers = errorHeaders;
		set.status = 500;
		return 'Internal Server Error during Google login.';
	}
};

// GET /login/discord
export const handleDiscordLogin = async ({ set, cookie }: any) => {
	const { url, state } = getDiscordAuthorizationUrl();

	// Create state cookie string
	const stateCookie = createStateCookie(state);

	// Prepare headers for the redirect response
	const headers = new Headers();
	headers.append('Set-Cookie', stateCookie);

	// Merge with existing Set-Cookie headers if necessary
	const existingSetCookie = set.headers['Set-Cookie'];
	if (existingSetCookie) {
		if (Array.isArray(existingSetCookie)) {
			existingSetCookie.forEach((c) => {
				headers.append('Set-Cookie', c);
			});
		} else {
			headers.append('Set-Cookie', existingSetCookie);
		}
	}

	// Set the Location header for the redirect
	headers.set('Location', url);

	// Return a Response object for the redirect
	return new Response(null, {
		status: 302,
		headers: headers,
		statusText: 'Found',
	});
};

// GET /login/discord/callback
export const handleDiscordCallback = async ({ query, set, headers, cookie }: any) => {
	const code = query.code as string;
	const state = query.state as string;

	const storedState = readStateCookie(headers.cookie);

	// Clear OAuth state cookie
	const clearStateCookie = serialize('oauth_state', '', { maxAge: 0, path: '/' });

	let currentCookies = set.headers['Set-Cookie'] || [];
	if (!Array.isArray(currentCookies)) {
		currentCookies = [currentCookies];
	}
	set.headers['Set-Cookie'] = [...currentCookies, clearStateCookie].filter(Boolean);

	try {
		const result = await processDiscordCallback(code, state, storedState);

		if ('error' in result) {
			set.status = result.status;
			return `Discord Login Error: ${result.error}`;
		}

		// Append the main session cookie
		currentCookies = set.headers['Set-Cookie'] || [];
		if (!Array.isArray(currentCookies)) {
			currentCookies = [currentCookies];
		}
		set.headers['Set-Cookie'] = [...currentCookies, result.sessionCookie].filter(Boolean);

		set.redirect = result.user.username ? '/' : '/setup-account';
		set.status = 302;
	} catch (error) {
		console.error('Unexpected error during Discord callback:', error);
		set.status = 500;
		return 'Internal Server Error during Discord login.';
	}
};

// GET /login/github
export const handleGithubLogin = async ({ set, cookie, navUrls }: { set: any; cookie: any; navUrls: UrlConfig }) => {
	if (!PRODUCTION) {
		// Return an informational page instead of redirecting
		return createHtmlResponse(
			'GitHub Login Disabled',
			`<p>GitHub login is currently disabled in this environment.</p>
			 <p>This is typically due to the complexities of handling multiple callback URLs (production vs. development) with GitHub's single allowed URL setting.</p>
			 <p><a href="/">Go back to homepage</a></p>`,
			navUrls, // Pass the navUrls from context
			{ user: null, session: null } // Assuming no user session context is needed/available here
		);
	}

	// Original logic for production environments
	const { url, state } = getGithubAuthorizationUrl();

	// Create state cookie string
	const stateCookie = createStateCookie(state);

	// Prepare headers for the redirect response
	const headers = new Headers();
	headers.append('Set-Cookie', stateCookie);

	// Merge with existing Set-Cookie headers if necessary
	const existingSetCookie = set.headers['Set-Cookie'];
	if (existingSetCookie) {
		if (Array.isArray(existingSetCookie)) {
			existingSetCookie.forEach((c) => {
				headers.append('Set-Cookie', c);
			});
		} else {
			headers.append('Set-Cookie', existingSetCookie);
		}
	}

	// Set the Location header for the redirect
	headers.set('Location', url);

	// Return a Response object for the redirect
	return new Response(null, {
		status: 302,
		headers: headers,
		statusText: 'Found',
	});
};

// GET /login/github/callback
export const handleGithubCallback = async ({ query, set, headers, cookie }: any) => {
	const code = query.code as string;
	const state = query.state as string;

	const storedState = readStateCookie(headers.cookie);

	// Clear OAuth state cookie
	const clearStateCookie = serialize('oauth_state', '', { maxAge: 0, path: '/' });

	let currentCookies = set.headers['Set-Cookie'] || [];
	if (!Array.isArray(currentCookies)) {
		currentCookies = [currentCookies];
	}
	set.headers['Set-Cookie'] = [...currentCookies, clearStateCookie].filter(Boolean);

	try {
		const result = await processGithubCallback(code, state, storedState);

		if ('error' in result) {
			set.status = result.status;
			return `GitHub Login Error: ${result.error}`;
		}

		// Append the main session cookie
		currentCookies = set.headers['Set-Cookie'] || [];
		if (!Array.isArray(currentCookies)) {
			currentCookies = [currentCookies];
		}
		set.headers['Set-Cookie'] = [...currentCookies, result.sessionCookie].filter(Boolean);

		set.redirect = result.user.username ? '/' : '/setup-account';
		set.status = 302;
	} catch (error) {
		console.error('Unexpected error during GitHub callback:', error);
		set.status = 500;
		return 'Internal Server Error during GitHub login.';
	}
};

// GET /logout
export const handleLogout = async ({ headers, set }: any) => {
	console.log('[Handler handleLogout] Executing...');
	const sessionId = readSessionCookie(headers?.cookie);
	if (sessionId) {
		try {
			await invalidateSession(sessionId);
		} catch (error) {
			console.error('[Handler handleLogout] Error invalidating session:', error);
		}
	} else {
		// Log if no session was found to clear - useful for debugging
		console.log('[Handler handleLogout] No session cookie found to invalidate.');
	}
	// Set blank cookie header
	set.headers['Set-Cookie'] = createBlankSessionCookie();
	// Explicitly set Location header for redirect
	set.headers.Location = '/';
	// Set status code
	set.status = 302;
	// Return null response for redirect
	return new Response(null);
};

// GET /setup-account
export const handleSetupAccountGet = async (context: any) => {
	console.log('[Handler handleSetupAccountGet] Executing...');
	if (!context || typeof context.set !== 'object' || typeof context.html !== 'function') {
		console.error('[Handler handleSetupAccountGet] Invalid context received (check set/html)!');
		try {
			if (context?.set) {
				context.set.status = 500;
			}
		} catch (e) {
			console.error('handleSetupAccountGet: Error setting status code.', e);
		}
		return 'Internal Server Error: Invalid context.';
	}
	const { html, user, set } = context;
	if (!user) {
		set.redirect = '/login';
		set.status = 302;
		return '';
	}
	return html(`
        <h1>Setup Your Account</h1>
        <p>Choose a username (3-16 characters, letters, numbers, underscores):</p>
        <form method="POST" action="/setup-account">
            <input type="text" name="username" required minlength="3" maxlength="16" pattern="^[a-zA-Z0-9_]{3,16}$" />
            <button type="submit">Set Username</button>
        </form>
    `);
};

// POST /setup-account
export const handleSetupAccountPost = async (context: any) => {
	console.log('[Handler handleSetupAccountPost] Executing...');
	const { body, user, set } = context;
	if (!user) {
		set.status = 401;
		return 'You must be logged in to set a username.';
	}
	if (user.username) {
		set.status = 400;
		return 'Username already set.';
	}
	const validation = z.object({ username: z.string().regex(USERNAME_REGEX) }).safeParse(body);
	if (!validation.success) {
		set.status = 400;
		return 'Invalid username format (3-16 characters, letters, numbers, underscores).';
	}
	const { username } = validation.data;
	try {
		const existingUser = await UserModel.findOne({ username: username });
		if (existingUser) {
			set.status = 409;
			return 'Username is already taken.';
		}
		const userId = user._id ?? user.id;
		if (!userId) {
			console.error('Authentication error: User ID not found in context user object.', user);
			set.status = 401;
			return 'Authentication error: User ID not found.';
		}
		const updatedUser = await UserModel.findByIdAndUpdate(userId, { username: username }, { new: true });
		if (!updatedUser) {
			set.status = 404;
			return 'User not found during update.';
		}
		set.redirect = '/';
		set.status = 302;
		return;
	} catch (error: any) {
		console.error('[Handler handleSetupAccountPost] Error setting username', error);
		if (error?.code === 11000) {
			set.status = 409;
			return 'Username is already taken.';
		}
		set.status = 500;
		return 'Failed to set username.';
	}
};
