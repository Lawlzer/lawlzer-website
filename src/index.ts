import { Elysia, t, type Context } from 'elysia';
import { html } from '@elysiajs/html'; // Import html plugin
import type { UrlConfig, UserSession, Subdomain } from './types'; // Import types and Subdomain
import { createHtmlResponse } from './utils/html'; // Import utility
import { isUserSetupComplete } from './utils/user'; // Import user utility
import { handleValorantHome } from './valorant/handlers'; // Import Valorant handlers
import { handleOverwatchHome } from './overwatch/handlers'; // Import Overwatch handlers
import { connectToDatabase } from './db/connect'; // Import DB connector
import { customAuthMiddleware } from './middleware/luciaAuth'; // Corrected import name
import { handleLoginGet, handleRegisterGet, handleGoogleLogin, handleGoogleCallback, handleDiscordLogin, handleDiscordCallback, handleGithubLogin, handleGithubCallback, handleLogout, handleSetupAccountGet, handleSetupAccountPost } from './auth/handlers'; // Import auth handlers
import { throwError } from '@lawlzer/utils';
import { navUrls, dynamicBaseHost, dynamicValorantHost, dynamicOverwatchHost } from './config';
import type { CustomAuthContext } from './middleware/luciaAuth'; // Import the context type
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
const authRoutes = new Elysia({ prefix: '/login', name: 'auth' }).use(html()).get('', handleLoginGet).get('/google', handleGoogleLogin).get('/google/callback', handleGoogleCallback).get('/discord', handleDiscordLogin).get('/discord/callback', handleDiscordCallback).get('/github', handleGithubLogin).get('/github/callback', handleGithubCallback);

// Define base routes including authentication
const baseRoutes = new Elysia({ name: 'base' })
	.use(html())
	.derive(() => ({ navUrls })) // Derive navUrls
	.get('/', ({ navUrls }) => {
		// This route returns the structured data, NOT raw HTML
		return { title: 'Welcome to Lawlzer.com', body: '<p>This is the main homepage.</p>', navUrls };
	})
	.use(authRoutes) // Mount login routes under /login
	.get('/register', handleRegisterGet) // Assuming this redirects or doesn't need html()
	.get('/logout', handleLogout)
	.get('/setup-account', handleSetupAccountGet) // Needs html() from baseRoutes
	.post('/setup-account', handleSetupAccountPost); // Handles POST, likely returns redirect

/* Commenting out unused route definitions to address linter errors
const valorantRoutes = new Elysia({ name: 'valorant' })
	.derive(() => ({ navUrls }))
	.get('/', ({ navUrls }) => handleValorantHome({ navUrls, user: null, session: null })) // Pass dummy user/session for type match
	.get('/hero/:heroId', ({ params: { heroId }, navUrls }) => ({ title: `Valorant Hero: ${heroId}`, body: `<p>Details for hero ${heroId}</p>`, navUrls }));

const overwatchRoutes = new Elysia({ name: 'overwatch' })
	.derive(() => ({ navUrls }))
	.get('/', ({ navUrls }) => handleOverwatchHome({ navUrls, user: null, session: null })) // Pass dummy user/session for type match
	.get('/map/:mapName', ({ params: { mapName }, navUrls }) => ({ title: `Overwatch Map: ${mapName}`, body: `<p>Details for map ${mapName}</p>`, navUrls }));
*/

// Define the expected shape of the data returned by page handlers that NEED HTML wrapping
interface PageHandlerResponse {
	title: string;
	body: string;
	navUrls: UrlConfig;
}

// --- Helper Functions --- //
// Moved deriveSubdomain definition here
const deriveSubdomain = (context: Context): { subdomain: Subdomain } => {
	const host = context.request.headers.get('host');
	if (host === dynamicBaseHost) return { subdomain: 'base' };
	if (host === dynamicValorantHost) return { subdomain: 'valorant' };
	if (host === dynamicOverwatchHost) return { subdomain: 'overwatch' };
	return { subdomain: 'unknown' };
};

// --- Type Definitions for Context within Guards/Handlers --- //
// Define the expected context shape after all initial derives
type AppContext = Context & CustomAuthContext & { subdomain: Subdomain; navUrls: UrlConfig };

// --- Main Application --- //

const app = new Elysia()
	// Derive initial context properties
	.derive(deriveSubdomain)
	.use(customAuthMiddleware()) // Provides user, session
	.derive(() => ({ navUrls })) // Provides navUrls
	.use(html()) // Apply html globally

	// --- Base Domain Setup/Auth Redirect Middleware --- //
	// This middleware ONLY runs redirect logic for the base domain
	.onBeforeHandle(
		{ as: 'global' }, // Run this early
		(context) => {
			const { subdomain, user, set, request, path } = context as AppContext;

			// Only apply this logic if we are on the base domain
			if (subdomain !== 'base') {
				return; // Do nothing for other subdomains
			}

			// Check if user setup is complete
			const setupComplete = isUserSetupComplete(user);

			// Force Setup Redirect Check (if setup NOT complete)
			if (user && !setupComplete) {
				const isPathAllowed = ALLOWED_PATHS_FOR_UNFINISHED_USERS.some((p) => path === p);
				const isLoginPath = path.startsWith('/login');

				if (!isPathAllowed && !isLoginPath) {
					set.headers['Location'] = '/setup-account';
					set.status = 302;
					return new Response(null); // Halt
				}
			}

			// Redirect away from /setup-account (if setup IS complete)
			if (setupComplete && path === '/setup-account') {
				set.headers['Location'] = '/';
				set.status = 302;
				return new Response(null); // Halt
			}
		}
	)

	// --- Main Route Handler (Dispatches Based on Subdomain) --- //
	.get('/', (context) => {
		const { subdomain, navUrls, user, session } = context as AppContext;

		switch (subdomain) {
			case 'base':
				return createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>', navUrls, { user, session });
			case 'valorant':
				return handleValorantHome({ navUrls, user, session });
			case 'overwatch':
				return handleOverwatchHome({ navUrls, user, session });
			default: // 'unknown' or any other case
				context.set.status = 400;
				return createHtmlResponse('Unknown Host', `<p>The requested host (${context.request.headers.get('host') ?? 'unknown'}) is not recognized.</p>`, navUrls, { user, session });
		}
	})

	// --- Subdomain-Specific Routes --- //

	// Valorant Specific
	.get('/hero/:heroId', (context) => {
		const { subdomain, params, navUrls, user, session } = context as AppContext & { params: { heroId: string } };
		if (subdomain !== 'valorant') {
			context.set.status = 404;
			return createHtmlResponse('Not Found', '<p>Page not found on this domain.</p>', navUrls, { user, session });
		}
		return createHtmlResponse(`Valorant Hero: ${params.heroId}`, `<p>Details for hero ${params.heroId}</p>`, navUrls, { user, session });
	})

	// Overwatch Specific
	.get('/map/:mapName', (context) => {
		const { subdomain, params, navUrls, user, session } = context as AppContext & { params: { mapName: string } };
		if (subdomain !== 'overwatch') {
			context.set.status = 404;
			return createHtmlResponse('Not Found', '<p>Page not found on this domain.</p>', navUrls, { user, session });
		}
		return createHtmlResponse(`Overwatch Map: ${params.mapName}`, `<p>Details for map ${params.mapName}</p>`, navUrls, { user, session });
	})

	// --- Base Domain Only Routes --- //

	// Authentication routes (already prefixed with /login)
	.use(authRoutes)

	// Other base-domain specific routes
	// Add subdomain check here if needed, though middleware should handle most cases
	.get('/register', (context) => {
		const { subdomain, set } = context as AppContext;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found'; // Simple text response for non-HTML route
		}
		return handleRegisterGet(context as any); // Cast context if handler expects specific type
	})
	.get('/logout', (context) => {
		const { subdomain, set } = context as AppContext;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		return handleLogout(context as any); // Cast context if needed
	})
	.get('/setup-account', (context) => {
		const { subdomain, set } = context as AppContext;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		// The onBeforeHandle middleware should redirect away if setup is complete
		// or redirect to login if no user. If it reaches here, user exists and needs setup.
		return handleSetupAccountGet(context as any); // Cast context if needed
	})
	.post('/setup-account', (context) => {
		const { subdomain, set } = context as AppContext;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		// Middleware ensures user exists and setup isn't complete
		return handleSetupAccountPost(context as any); // Cast context if needed
	})

	// --- Global Fallback / 404 Handler --- //
	// This catches any requests not handled by the specific routes above
	.all('*', (context) => {
		const { navUrls, user, session, request } = context as AppContext;
		context.set.status = 404;
		return createHtmlResponse('Not Found', '<p>The page you requested could not be found.</p>', navUrls, { user, session });
	})

	// Simplified onError handler
	.onError(({ code, error, set, request }) => {
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

		// Render error page - Use global navUrls as fallback
		// User/Session context might not be available here, so pass null
		return createHtmlResponse(
			`Error ${statusCode}`,
			`<p>Sorry, something went wrong.</p><p>Error Code: ${code ?? 'UNKNOWN'}</p>`,
			navUrls, // Global navUrls should be accessible
			{ user: null, session: null } // Assume user/session context might be lost
		);
	})
	.listen(process.env.PORT || 3000); // Use PORT from env or default

console.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
