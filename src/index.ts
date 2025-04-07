import { Elysia, t } from 'elysia';
import type { UrlConfig } from './types'; // Import types
import { createHtmlResponse } from './utils/html'; // Import utility
import { handleValorantHome } from './valorant/handlers'; // Import Valorant handlers
import { handleOverwatchHome } from './overwatch/handlers'; // Import Overwatch handlers
import { throwError } from '@lawlzer/utils';

const BASE_URL = process.env.BASE_URL ?? throwError('BASE_URL environment variable is not set.');

let parsedBaseUrl: URL;
try {
	parsedBaseUrl = new URL(BASE_URL);
} catch (error) {
	throw new Error(`Invalid BASE_URL: ${BASE_URL}`);
}

const baseHostname = parsedBaseUrl.hostname;
const basePort = parsedBaseUrl.port;
const baseOrigin = parsedBaseUrl.origin; // Includes protocol, hostname, and port (if specified)
const baseHost = basePort ? `${baseHostname}:${basePort}` : baseHostname; // hostname:port or just hostname

const frontendPort = process.env.FRONTEND_PORT;
const displayPort = frontendPort || basePort; // Use frontend port if specified, else backend port
const displayPortString = displayPort ? `:${displayPort}` : '';

const isLocal = baseHostname.startsWith('local.');
const coreDomain = isLocal ? baseHostname.substring(6) : baseHostname;

const valorantSubdomain = isLocal ? `local.valorant.${coreDomain}` : `valorant.${coreDomain}`;
const overwatchSubdomain = isLocal ? `local.overwatch.${coreDomain}` : `overwatch.${coreDomain}`;

// These represent the actual host:port the server needs to match
const dynamicBaseHost = baseHost;
const dynamicValorantHost = `${valorantSubdomain}${basePort ? ':' + basePort : ''}`;
const dynamicOverwatchHost = `${overwatchSubdomain}${basePort ? ':' + basePort : ''}`;

// These represent the URLs to be displayed in the nav bar (potentially different port)
const navUrls: UrlConfig = {
	home: `${parsedBaseUrl.protocol}//${baseHostname}${displayPortString}`,
	valorant: `${parsedBaseUrl.protocol}//${valorantSubdomain}${displayPortString}`,
	overwatch: `${parsedBaseUrl.protocol}//${overwatchSubdomain}${displayPortString}`,
};

// Define routes for each subdomain
const baseRoutes = new Elysia({ name: 'base' })
	.derive(() => ({ navUrls })) // Derive navUrls within this sub-app
	.get('/', ({ navUrls }) => createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>', navUrls));

const valorantRoutes = new Elysia({ name: 'valorant' })
	.derive(() => ({ navUrls }))
	.get('/', handleValorantHome)
	.get(
		'/hero/:heroId',
		(
			{ params: { heroId }, navUrls } // Example route
		) => createHtmlResponse(`Valorant Hero: ${heroId}`, `<p>Details for hero ${heroId}</p>`, navUrls)
	);

const overwatchRoutes = new Elysia({ name: 'overwatch' })
	.derive(() => ({ navUrls }))
	.get('/', handleOverwatchHome)
	.get(
		'/map/:mapName',
		(
			{ params: { mapName }, navUrls } // Example route
		) => createHtmlResponse(`Overwatch Map: ${mapName}`, `<p>Details for map ${mapName}</p>`, navUrls)
	);

// Main app for subdomain routing
const app = new Elysia()
	.derive((context): { subdomain: 'base' | 'valorant' | 'overwatch' | 'unknown' } => {
		const host = context.request.headers.get('host');
		if (host === dynamicBaseHost) return { subdomain: 'base' };
		if (host === dynamicValorantHost) return { subdomain: 'valorant' };
		if (host === dynamicOverwatchHost) return { subdomain: 'overwatch' };
		return { subdomain: 'unknown' };
	})
	.derive(() => ({ navUrls })) // Derive navUrls for fallback/error handlers
	.all('*', async (context) => {
		const { subdomain, request, set } = context;

		switch (subdomain) {
			case 'base':
				return baseRoutes.handle(request); // Delegate to base routes
			case 'valorant':
				return valorantRoutes.handle(request); // Delegate to valorant routes
			case 'overwatch':
				return overwatchRoutes.handle(request); // Delegate to overwatch routes
			case 'unknown':
				set.status = 400;
				return createHtmlResponse('Unknown Host', `<p>The requested host (${request.headers.get('host') ?? 'unknown'}) is not recognized.</p>`, context.navUrls);
			default:
				// Fallback for unhandled routes within a recognized subdomain (e.g., 404)
				// Note: sub-apps like baseRoutes might have their own 404 handling.
				// This path might not be reached if sub-apps handle all routes including 404.
				set.status = 404;
				return createHtmlResponse('Not Found', '<p>The requested page was not found.</p>', context.navUrls);
		}
	})
	.onError(({ code, error, set, request }) => {
		// Use the globally defined navUrls for the error response
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error [${code}] on ${request.url}: ${errorMessage}`);
		set.status = 500;
		// Avoid leaking detailed errors in production
		return createHtmlResponse('Internal Server Error', '<p>Something went wrong.</p>', navUrls);
	})
	.listen(basePort ? parseInt(basePort) : 3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
