import { Elysia, t, type Context as ElysiaContext } from 'elysia';
import { html } from '@elysiajs/html'; // Import html plugin
import type { UrlConfig, UserSession, Subdomain, AppContext } from './types'; // Keep AppContext import for potential use
import { createHtmlResponse } from './utils/html'; // Import utility
import { isUserSetupComplete } from './utils/user'; // Import user utility
import { handleValorantHome } from './valorant/handlers'; // Import Valorant handlers
import { handleOverwatchHome } from './overwatch/handlers'; // Import Overwatch handlers
import { connectToDatabase } from './db/connect'; // Import DB connector
import { customAuthMiddleware } from './middleware/luciaAuth'; // Corrected import name
import { handleLoginGet, handleRegisterGet, handleGoogleLogin, handleGoogleCallback, handleDiscordLogin, handleDiscordCallback, handleGithubLogin, handleGithubCallback, handleLogout, handleSetupAccountGet, handleSetupAccountPost } from './auth/handlers'; // Import auth handlers
import { throwError } from '@lawlzer/utils';
import { navUrls, dynamicBaseHost, dynamicValorantHost, dynamicOverwatchHost } from './config';
import type { IUser } from './db/models/User'; // Import IUser
import type { ISession } from './db/models/Session'; // Import ISession

// Connect to database on startup
await connectToDatabase();

// --- Constants are now imported from config.ts --- //

// Define paths allowed for users who haven't set up their account
const ALLOWED_PATHS_FOR_UNFINISHED_USERS = [
	'/setup-account', // The setup page itself
	'/logout', // Ability to log out
];

// Define authentication routes plugin
// Let Elysia infer types within this plugin instance
const authRoutes = new Elysia({ prefix: '/login', name: 'auth' }).use(html()).get('', handleLoginGet).get('/google', handleGoogleLogin).get('/google/callback', handleGoogleCallback).get('/discord', handleDiscordLogin).get('/discord/callback', handleDiscordCallback).get('/github', handleGithubLogin).get('/github/callback', handleGithubCallback);

// Commenting out unused baseRoutes definition as routes are now in the main app
/*
const baseRoutes = new Elysia({ name: 'base' })
	.use(html())
	.derive(() => ({ navUrls })) // Derive navUrls
	.get('/', ({ derive: { navUrls } }) => { // Use correct access via derive
		// This route returns the structured data, NOT raw HTML
		return { title: 'Welcome to Lawlzer.com', body: '<p>This is the main homepage.</p>', navUrls };
	})
	.use(authRoutes) // Mount login routes under /login
	.get('/register', handleRegisterGet) // Needs html() from baseRoutes
	.get('/logout', handleLogout)
	.get('/setup-account', handleSetupAccountGet) // Now handled by main app instance
	.post('/setup-account', handleSetupAccountPost); // Now handled by main app instance
*/

/* Commented out unused routes */

// Define the expected shape of the data returned by page handlers that NEED HTML wrapping
interface PageHandlerResponse {
	title: string;
	body: string;
	navUrls: UrlConfig;
}

// --- Helper Functions --- //
const deriveSubdomain = (context: ElysiaContext): { subdomain: Subdomain } => {
	const host = context.request.headers.get('host');
	if (host === dynamicBaseHost) return { subdomain: 'base' };
	if (host === dynamicValorantHost) return { subdomain: 'valorant' };
	if (host === dynamicOverwatchHost) return { subdomain: 'overwatch' };
	return { subdomain: 'unknown' };
};

// Remove old AppContext definition - Already removed previously

// --- Main Application --- //

const app = new Elysia()
	.derive(deriveSubdomain)
	.use(customAuthMiddleware())
	.derive(() => ({ navUrls }))
	.use(html())

	// --- Base Domain Setup/Auth Redirect Middleware --- //
	.onBeforeHandle({ as: 'global' }, (context) => {
		// Access properties directly
		const { subdomain, user, set, request, path } = context as any;
		// Log incoming request
		console.log(`--> ${request.method} ${request.url}`); // Log method and full URL

		console.log('[Global onBeforeHandle] Context Keys:', Object.keys(context));
		console.log('[Global onBeforeHandle] Subdomain value:', subdomain);

		if (typeof subdomain !== 'string') {
			console.error('[Global onBeforeHandle] Outcome: subdomain is invalid or missing! Halting.');
			// Potentially set an error status if appropriate, but returning may be enough
			return; // Exit early
		}

		// --- Logic only for base domain ---
		if (subdomain === 'base') {
			// Redirect to login if trying to access setup page while logged out
			if (path === '/setup-account' && !user) {
				console.log('[Global onBeforeHandle] Outcome: User null, redirecting /setup-account to /login');
				set.headers['Location'] = '/login';
				set.status = 302;
				return new Response(null); // Halt with explicit redirect response
			}

			const setupComplete = isUserSetupComplete(user as IUser | null);

			// Force Setup Redirect Check (if logged in but setup NOT complete)
			if (user && !setupComplete) {
				const isPathAllowed = ALLOWED_PATHS_FOR_UNFINISHED_USERS.some((p) => path === p);
				const isLoginPath = path.startsWith('/login');
				if (!isPathAllowed && !isLoginPath) {
					console.log('[Global onBeforeHandle] Outcome: User needs setup, redirecting to /setup-account');
					set.headers['Location'] = '/setup-account';
					set.status = 302;
					return new Response(null); // Halt
				}
			}

			// Redirect away from /setup-account (if logged in and setup IS complete)
			if (setupComplete && path === '/setup-account') {
				console.log('[Global onBeforeHandle] Outcome: User already set up, redirecting /setup-account to /');
				set.headers['Location'] = '/';
				set.status = 302;
				return new Response(null); // Halt
			}
		}
		// --- End base domain logic ---

		// If no redirect conditions met within this hook
		console.log('[Global onBeforeHandle] Outcome: Proceeding.');
	})

	// --- Main Route Handler (Dispatches Based on Subdomain) --- //
	.get('/', (context) => {
		// Access properties directly
		const { subdomain, navUrls, user, session, set, request } = context as any;

		switch (subdomain) {
			case 'base':
				return createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>', navUrls, { user, session });
			case 'valorant':
				return handleValorantHome({ navUrls, user, session });
			case 'overwatch':
				return handleOverwatchHome({ navUrls, user, session });
			default:
				set.status = 400;
				return createHtmlResponse('Unknown Host', `<p>The requested host (${request.headers.get('host') ?? 'unknown'}) is not recognized.</p>`, navUrls, { user, session });
		}
	})

	// --- Subdomain-Specific Routes --- //
	.get('/hero/:heroId', (context) => {
		// Access properties directly
		const { subdomain, navUrls, params, user, session, set } = context as any;
		if (subdomain !== 'valorant') {
			set.status = 404;
			return createHtmlResponse('Not Found', '<p>Page not found on this domain.</p>', navUrls, { user, session });
		}
		return createHtmlResponse(`Valorant Hero: ${params.heroId}`, `<p>Details for hero ${params.heroId}</p>`, navUrls, { user, session });
	})
	.get('/map/:mapName', (context) => {
		// Access properties directly
		const { subdomain, navUrls, params, user, session, set } = context as any;
		if (subdomain !== 'overwatch') {
			set.status = 404;
			return createHtmlResponse('Not Found', '<p>Page not found on this domain.</p>', navUrls, { user, session });
		}
		return createHtmlResponse(`Overwatch Map: ${params.mapName}`, `<p>Details for map ${params.mapName}</p>`, navUrls, { user, session });
	})

	// --- Base Domain Only Routes --- //
	.use(authRoutes)

	.get('/register', (context) => {
		// Access properties directly
		const { subdomain, set } = context as any;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		return handleRegisterGet(context);
	})
	.get('/logout', (context) => {
		// Access properties directly
		const { subdomain, set } = context as any;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		return handleLogout(context);
	})
	.get('/setup-account', handleSetupAccountGet, {
		beforeHandle: (context) => {
			// Access properties directly
			const { subdomain, set } = context as any;
			console.log('[/setup-account beforeHandle] Hook executing...'); // Changed log message

			// Check subdomain directly
			if (typeof subdomain !== 'string') {
				console.error('[/setup-account beforeHandle] Outcome: Invalid subdomain found! Halting.'); // Changed log message
				try {
					set.status = 500;
				} catch (e) {
					console.error('Failed to set status', e);
				}
				return 'Internal Server Error: Invalid context (subdomain) in route beforeHandle.';
			}

			console.log('[/setup-account beforeHandle] Subdomain value:', subdomain);

			if (subdomain !== 'base') {
				console.log('[/setup-account beforeHandle] Outcome: Wrong subdomain, returning 404.'); // Changed log message
				set.status = 404;
				return 'Not Found';
			}
			console.log('[/setup-account beforeHandle] Outcome: Checks passed, proceeding to handler.'); // Changed log message
		},
	})
	.post('/setup-account', (context) => {
		// Access properties directly
		const { subdomain, set } = context as any;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		return handleSetupAccountPost(context as any);
	})

	// --- Global Fallback / 404 Handler --- //
	.all('*', (context) => {
		// Access properties directly
		const { navUrls, user, session, set } = context as any;
		set.status = 404;
		return createHtmlResponse('Not Found', '<p>The page you requested could not be found.</p>', navUrls, { user, session });
	})

	// Simplified onError handler
	.onError(({ code, error, set, request }) => {
		const currentNavUrls = navUrls; // Access from outer scope

		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Global Error Handler [${code}] on ${request.method} ${request.url}: ${errorMessage}`, error);

		let statusCode: number;
		if (typeof set.status === 'number' && set.status >= 400) {
			statusCode = set.status;
		} else {
			switch (code) {
				case 'NOT_FOUND':
					statusCode = 404;
					break;
				case 'VALIDATION':
					statusCode = 400;
					break;
				case 'INTERNAL_SERVER_ERROR':
				default:
					statusCode = 500;
					break;
			}
		}
		set.status = statusCode;

		return createHtmlResponse(`Error ${statusCode}`, `<p>Sorry, something went wrong.</p><p>Error Code: ${code ?? 'UNKNOWN'}</p>`, currentNavUrls, { user: null, session: null });
	})

	// --- Global Response Logging using onAfterHandle --- //
	.onAfterHandle((context: any) => {
		// Use any to avoid complex type errors for now
		const { request, set, response } = context;
		// Determine the final status code from the set object
		const status = set?.status ?? 200; // Add optional chaining for set
		const location = set?.headers?.['Location']; // Add optional chaining

		if (location) {
			console.log(`<-- ${request.method} ${request.url} Response Status: ${status} (Redirecting to: ${location})`);
		} else {
			console.log(`<-- ${request.method} ${request.url} Response Status: ${status}`);
		}

		// Important: onAfterHandle expects the response value to be returned
		// Response might be undefined in some cases (e.g., error before response generation)
		return response;
	})

	.listen(process.env.PORT || 3000);

console.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
