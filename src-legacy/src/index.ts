import { Elysia, t, type Context as ElysiaContext } from 'elysia'; // Keep RouteSchema, LocalHook if needed elsewhere, removed for now
import { html } from '@elysiajs/html';
import type { UrlConfig, Subdomain } from './types'; // Removed unused UserSession, AppContext
import { createHtmlResponse } from './utils/html';
import { isUserSetupComplete } from './utils/user';
import { handleValorantHome } from './valorant/handlers';
import { handleOverwatchHome } from './overwatch/handlers';
import { connectToDatabase } from './db/connect';
import { customAuthMiddleware } from './middleware/luciaAuth';
import { handleLoginGet, handleRegisterGet, handleGoogleLogin, handleGoogleCallback, handleDiscordLogin, handleDiscordCallback, handleGithubLogin, handleGithubCallback, handleLogout, handleSetupAccountGet, handleSetupAccountPost } from './auth/handlers';
import { throwError } from '@lawlzer/utils';
import { navUrls, dynamicBaseHost, dynamicValorantHost, dynamicOverwatchHost, DEBUG_CONTEXT_KEYS, DEBUG_SUBDOMAIN_VALUE } from './config';
// Use our own IUser/ISession types provided by the middleware
import type { IUser } from './db/models/User';
import type { ISession } from './db/models/Session';
// Removed Lucia User/Session import

// --- Define App Context Structure ---
// Using IUser and ISession from our models, provided by luciaAuth middleware
type AppContext = ElysiaContext & {
	derive: {
		subdomain: Subdomain;
		navUrls: UrlConfig;
		user: IUser | null; // Use IUser
		session: ISession | null; // Use ISession
	};
	// Include other standard context properties often used
	set: ElysiaContext['set'];
	request: ElysiaContext['request'];
	store: ElysiaContext['store'];
	cookie: ElysiaContext['cookie'];
	path: string; // Available in hooks
	// params and body are added via route definitions or intersections
};

// Type Helper for Handlers with Params
type HandlerContextWithParams<TParams extends Record<string, string>> = AppContext & { params: TParams };

// Type Helper for Handlers with Body
type HandlerContextWithBody<TBody extends Record<string, any>> = AppContext & { body: TBody };

// Connect to database on startup
await connectToDatabase();

// --- Helper Functions --- //
const deriveSubdomain = (context: ElysiaContext): { subdomain: Subdomain } => {
	const host = context.request.headers.get('host');
	if (host === dynamicBaseHost) return { subdomain: 'base' };
	if (host === dynamicValorantHost) return { subdomain: 'valorant' };
	if (host === dynamicOverwatchHost) return { subdomain: 'overwatch' };
	return { subdomain: 'unknown' };
};

// Define paths allowed for users who haven't set up their account
const ALLOWED_PATHS_FOR_UNFINISHED_USERS = ['/setup-account', '/logout'];

// Define authentication routes plugin
const authRoutes = new Elysia({ prefix: '/login', name: 'auth' }).use(html()).get('', handleLoginGet).get('/google', handleGoogleLogin).get('/google/callback', handleGoogleCallback).get('/discord', handleDiscordLogin).get('/discord/callback', handleDiscordCallback).get('/github', handleGithubLogin).get('/github/callback', handleGithubCallback);

// --- Main Application --- //

const app = new Elysia()
	.derive(deriveSubdomain)
	.use(customAuthMiddleware()) // Adds IUser & ISession to context.derive
	.derive(() => ({ navUrls })) // Adds navUrls to context.derive
	.use(html())

	// --- Base Domain Setup/Auth Redirect Middleware --- //
	// Hooks receive the context as it is at that stage
	// Type assertion needed here because TS doesn't know middleware added properties yet.
	.onBeforeHandle({ as: 'global' }, (context) => {
		// Assert AppContext shape using unknown intermediary
		const { derive, set, request, path } = context as unknown as AppContext;
		const { subdomain, user, session } = derive;
		console.info(`--> ${request.method} ${request.url}`);

		if (DEBUG_CONTEXT_KEYS) {
			console.debug('[Global onBeforeHandle] Context Keys:', Object.keys(context));
		}
		if (DEBUG_SUBDOMAIN_VALUE) {
			console.debug('[Global onBeforeHandle] Subdomain value:', subdomain);
		}

		if (typeof subdomain !== 'string' || !['base', 'valorant', 'overwatch', 'unknown'].includes(subdomain)) {
			console.error('[Global onBeforeHandle] subdomain is invalid or missing! Halting.');
			set.status = 400;
			return new Response('Invalid Host', { status: 400 });
		}

		// --- Logic only for base domain ---
		if (subdomain === 'base') {
			if (path === '/setup-account' && !user) {
				set.headers.Location = '/login';
				set.status = 302;
				return new Response(null);
			}

			// isUserSetupComplete now receives IUser | null directly
			const setupComplete = isUserSetupComplete(user);

			if (user && !setupComplete) {
				const isPathAllowed = ALLOWED_PATHS_FOR_UNFINISHED_USERS.some((p) => path === p);
				const isLoginPath = path.startsWith('/login');
				if (!isPathAllowed && !isLoginPath) {
					set.headers.Location = '/setup-account';
					set.status = 302;
					return new Response(null);
				}
			}
			if (setupComplete && path === '/setup-account') {
				set.headers.Location = '/';
				set.status = 302;
				return new Response(null);
			}
		}
	})

	// --- Main Route Handler (Dispatches Based on Subdomain) --- //
	// Context here should have the properties from derive/middleware
	.get('/', (context) => {
		// Assert AppContext using unknown intermediary
		const { derive, set, request } = context as unknown as AppContext;
		// Use derived properties directly - remove navUrls from destructuring
		const { subdomain, user, session } = derive;

		switch (subdomain) {
			case 'base':
				return createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>', navUrls, { user, session });
			case 'valorant':
				return handleValorantHome({ navUrls, user, session });
			case 'overwatch':
				return handleOverwatchHome({ navUrls, user, session });
			case 'unknown': // Explicitly handle unknown case from deriveSubdomain
			default: // Default also handles unknown, but explicit is clearer
				set.status = 400;
				return createHtmlResponse('Unknown Host', `<p>The requested host (${request.headers.get('host') ?? 'unknown'}) is not recognized.</p>`, navUrls, { user, session });
		}
	})

	// --- Subdomain-Specific Routes --- //
	.get('/hero/:heroId', (context) => {
		// Assert context type using unknown intermediary
		const { derive, params, set } = context as unknown as HandlerContextWithParams<{ heroId: string }>;
		// Use derived properties directly - remove navUrls from destructuring
		const { subdomain, user, session } = derive;
		if (subdomain !== 'valorant') {
			set.status = 404;
			return createHtmlResponse('Not Found', '<p>Page not found on this domain.</p>', navUrls, { user, session });
		}
		return createHtmlResponse(`Valorant Hero: ${params.heroId}`, `<p>Details for hero ${params.heroId}</p>`, navUrls, { user, session });
	})
	.get('/map/:mapName', (context) => {
		// Assert context type using unknown intermediary
		const { derive, params, set } = context as unknown as HandlerContextWithParams<{ mapName: string }>;
		// Use derived properties directly - remove navUrls from destructuring
		const { subdomain, user, session } = derive;
		if (subdomain !== 'overwatch') {
			set.status = 404;
			return createHtmlResponse('Not Found', '<p>Page not found on this domain.</p>', navUrls, { user, session });
		}
		return createHtmlResponse(`Overwatch Map: ${params.mapName}`, `<p>Details for map ${params.mapName}</p>`, navUrls, { user, session });
	})

	// --- Base Domain Only Routes --- //
	.use(authRoutes) // Mounted at /login

	.get('/register', async (context) => {
		// Assert context type using unknown intermediary
		const { derive, set } = context as unknown as AppContext;
		const { subdomain } = derive;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		// Pass asserted context
		return handleRegisterGet(context as unknown as AppContext);
	})
	.get('/logout', async (context) => {
		// Assert context type using unknown intermediary
		const { derive, set } = context as unknown as AppContext;
		const { subdomain } = derive;
		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		// Pass asserted context
		return handleLogout(context as unknown as AppContext);
	})
	.get('/setup-account', handleSetupAccountGet, {
		// Hook uses AppContext
		beforeHandle: (context) => {
			// Assert context type using unknown intermediary
			const { derive, set } = context as unknown as AppContext;
			const { subdomain } = derive;
			console.info('[/setup-account beforeHandle] Hook executing...');

			if (DEBUG_CONTEXT_KEYS) {
				console.debug('[/setup-account beforeHandle] Context Keys:', Object.keys(context));
			}
			if (DEBUG_SUBDOMAIN_VALUE) {
				console.debug('[/setup-account beforeHandle] Subdomain value:', subdomain);
			}

			if (typeof subdomain !== 'string') {
				console.error('[/setup-account beforeHandle] Invalid subdomain found! Halting.');
				set.status = 500;
				return 'Internal Server Error: Invalid context (subdomain) in route beforeHandle.';
			}
			if (subdomain !== 'base') {
				set.status = 404;
				return 'Not Found';
			}
		},
	})
	.post('/setup-account', async (context) => {
		// Assert context type using unknown intermediary
		const handlerContext = context as unknown as HandlerContextWithBody<{ username: string }>;
		const { derive, set, body } = handlerContext;
		const { subdomain } = derive;

		if (subdomain !== 'base') {
			set.status = 404;
			return 'Not Found';
		}
		// Pass the correctly typed context
		return handleSetupAccountPost(handlerContext);
	})

	// --- Global Fallback / 404 Handler --- //
	// Use AppContext here
	.all('*', (context) => {
		// Assert context type using unknown intermediary
		const { derive, set } = context as unknown as AppContext;
		// Use derived properties directly - remove navUrls from destructuring
		const { subdomain, user, session } = derive; // subdomain is unused here, but kept for consistency
		set.status = 404;
		return createHtmlResponse('Not Found', '<p>The page you requested could not be found.</p>', navUrls, { user, session });
	})

	// Error handler - context might not have full AppContext shape
	.onError((context) => {
		const { code, error, set, request } = context;
		// Safely access navUrls using optional chaining and unknown intermediary cast
		const currentNavUrls = (context as unknown as Partial<AppContext>)?.derive?.navUrls ?? navUrls;

		// Revert to String() for non-Error objects, accepting linter warning for safety
		const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
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
					statusCode = 500;
					break;
				case 'PARSE':
					statusCode = 400;
					break;
				case 'INVALID_COOKIE_SIGNATURE':
					statusCode = 400;
					break;
				case 'UNKNOWN':
				default:
					statusCode = 500;
					break;
			}
		}
		set.status = statusCode;

		return createHtmlResponse(`Error ${statusCode}`, `<p>Sorry, something went wrong.</p><p>Error Code: ${code ?? 'UNKNOWN'}</p>`, currentNavUrls, { user: null, session: null });
	})

	// --- Global Response Logging using onAfterHandle --- //
	// Basic ElysiaContext is sufficient here
	.onAfterHandle((context) => {
		const { request, set, response } = context as ElysiaContext & { response: unknown };
		const status = set?.status ?? 200;
		const location = set?.headers?.Location;

		// Explicit check for string type for the linter
		if (typeof location === 'string') {
			console.info(`<-- ${request.method} ${request.url} Response Status: ${status} (Redirecting to: ${location})`);
		} else {
			console.info(`<-- ${request.method} ${request.url} Response Status: ${status}`);
		}
		return response;
	})

	.listen(process.env.PORT ?? 3000);

console.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
