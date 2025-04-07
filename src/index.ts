import { Elysia, Context, t } from 'elysia';

// Load and validate BASE_URL from environment variables
const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
	throw new Error('BASE_URL environment variable is not set.');
}

// Parse the BASE_URL
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

// Optional: Read frontend port from environment
const frontendPort = process.env.FRONTEND_PORT;
const displayPort = frontendPort || basePort; // Use frontend port if specified, else backend port
const displayPortString = displayPort ? `:${displayPort}` : '';

// Remove HostConfig interface
// interface HostConfig { ... }

interface UrlConfig {
	home: string; // Full URL for nav
	valorant: string; // Full URL for nav
	overwatch: string; // Full URL for nav
}

// Remove intermediate host variables and object
// let hosts: HostConfig;
// let dynamicBaseHost: string; ... etc.
// const hosts = { ... } as const;

// --- Refactored Hostname and Nav URL Calculation ---

const isLocal = baseHostname.startsWith('local.');
const coreDomain = isLocal ? baseHostname.substring(6) : baseHostname;

const valorantSubdomain = isLocal ? `local.valorant.${coreDomain}` : `valorant.${coreDomain}`;
const overwatchSubdomain = isLocal ? `local.overwatch.${coreDomain}` : `overwatch.${coreDomain}`;

const dynamicBaseHost = baseHost; // The host the server should actually listen on/match
const dynamicValorantHost = `${valorantSubdomain}${basePort ? ':' + basePort : ''}`;
const dynamicOverwatchHost = `${overwatchSubdomain}${basePort ? ':' + basePort : ''}`;

// Navigation URLs use the baseHostname (which includes 'local.' if present)
// and the appropriate display port (frontend or backend)
const navUrls: UrlConfig = {
	home: `${parsedBaseUrl.protocol}//${baseHostname}${displayPortString}`,
	valorant: `${parsedBaseUrl.protocol}//${valorantSubdomain}${displayPortString}`,
	overwatch: `${parsedBaseUrl.protocol}//${overwatchSubdomain}${displayPortString}`,
};

// --- End Refactored Section ---

// Helper function to generate HTML response with top-bar
// This needs to be defined *before* it's used in the routes
const createHtmlResponse = (title: string, content: string): Response => {
	// Use pre-calculated navUrls
	const topBar = `
<nav style="background-color: #333; padding: 10px; text-align: center;">
  <a href="${navUrls.home}" style="color: white; margin: 0 15px; text-decoration: none;">Home</a>
  <a href="${navUrls.valorant}" style="color: white; margin: 0 15px; text-decoration: none;">Valorant</a>
  <a href="${navUrls.overwatch}" style="color: white; margin: 0 15px; text-decoration: none;">Overwatch</a>
</nav>
  `;
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
  </style>
</head>
<body>
  ${topBar}
  <main style="padding: 20px;">
    <h1>${title}</h1>
    ${content}
  </main>
</body>
</html>
  `;
	return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};

// Define the Elysia app
const app = new Elysia()
	// Derive the subdomain from the host header
	.derive((context): { subdomain: 'base' | 'valorant' | 'overwatch' | 'unknown' } => {
		const host = context.request.headers.get('host');
		if (host === dynamicBaseHost) {
			return { subdomain: 'base' };
		}
		if (host === dynamicValorantHost) {
			return { subdomain: 'valorant' };
		}
		if (host === dynamicOverwatchHost) {
			return { subdomain: 'overwatch' };
		}
		return { subdomain: 'unknown' };
	})
	// Handle GET requests to the root path
	.get('/', ({ subdomain, set }) => {
		switch (subdomain) {
			case 'base':
				return createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>');
			case 'valorant':
				return createHtmlResponse('Valorant Home', '<p>This is the homepage for the Valorant section.</p>');
			case 'overwatch':
				return createHtmlResponse('Overwatch Home', '<p>This is the homepage for the Overwatch section.</p>');
			default:
				set.status = 404; // Or perhaps a 400 Bad Request if the host is totally wrong
				return createHtmlResponse('Unknown Host', '<p>The requested host is not recognized.</p>');
		}
	})
	// Handle all other paths (404)
	.all('*', ({ subdomain, set }) => {
		set.status = 404;
		switch (subdomain) {
			case 'base':
				return createHtmlResponse('Not Found', '<p>The requested page was not found on lawlzer.com.</p>');
			case 'valorant':
				return createHtmlResponse('Not Found', '<p>The requested page was not found on the Valorant subdomain.</p>');
			case 'overwatch':
				return createHtmlResponse('Not Found', '<p>The requested page was not found on the Overwatch subdomain.</p>');
			default: // Unknown host already resulted in 404 from GET '/', but handle defensively
				return createHtmlResponse('Unknown Host / Not Found', '<p>The requested host or path was not found.</p>');
		}
	})
	.listen(basePort ? parseInt(basePort) : 3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
