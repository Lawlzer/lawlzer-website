import { Elysia, Context } from 'elysia';

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

// Define a specific type for the context needed by subdomain handlers
interface RequestContext {
	request: Request;
	// Add other properties from Context if they become necessary
}

// Helper function to generate HTML response with top-bar
const createHtmlResponse = (title: string, content: string): Response => {
	let valorantHost: string;
	let overwatchHost: string;
	const displayPort = frontendPort || basePort; // Use frontend port if specified, else backend port
	const portString = displayPort ? `:${displayPort}` : '';

	if (baseHostname.startsWith('local.')) {
		// Construct local development subdomain URLs like local.valorant.lawlzer.com
		const domainWithoutLocal = baseHostname.substring(6); // Remove "local."
		valorantHost = `local.valorant.${domainWithoutLocal}`;
		overwatchHost = `local.overwatch.${domainWithoutLocal}`;
	} else {
		// Construct production subdomain URLs like valorant.lawlzer.com
		valorantHost = `valorant.${baseHostname}`;
		overwatchHost = `overwatch.${baseHostname}`;
	}

	const homeUrl = `${parsedBaseUrl.protocol}//${baseHostname}${portString}`;
	const valorantUrl = `${parsedBaseUrl.protocol}//${valorantHost}${portString}`;
	const overwatchUrl = `${parsedBaseUrl.protocol}//${overwatchHost}${portString}`;

	const topBar = `
<nav style="background-color: #333; padding: 10px; text-align: center;">
  <a href="${homeUrl}" style="color: white; margin: 0 15px; text-decoration: none;">Home</a>
  <a href="${valorantUrl}" style="color: white; margin: 0 15px; text-decoration: none;">Valorant</a>
  <a href="${overwatchUrl}" style="color: white; margin: 0 15px; text-decoration: none;">Overwatch</a>
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

// Define handlers/routes for each subdomain potentially in separate files later
const handleValorantRequest = (context: RequestContext) => {
	const pathname = new URL(context.request.url).pathname;
	const headers = { 'Content-Type': 'text/html' };

	if (pathname === '/') {
		// Return Response with correct headers
		return createHtmlResponse('Valorant Home', '<p>This is the homepage for the Valorant section.</p>');
	}
	// Add more specific Valorant routes here...
	// Return 404 Response with correct headers
	const notFoundResponse = createHtmlResponse('Not Found', '<p>The requested page was not found on the Valorant subdomain.</p>');
	notFoundResponse.headers.set('Status', '404'); // Setting status via headers, alternative to new Response options
	return new Response(notFoundResponse.body, { status: 404, headers: notFoundResponse.headers }); // Proper 404 status
};

const handleOverwatchRequest = (context: RequestContext) => {
	const pathname = new URL(context.request.url).pathname;
	const headers = { 'Content-Type': 'text/html' };

	if (pathname === '/') {
		// Return Response with correct headers
		return createHtmlResponse('Overwatch Home', '<p>This is the homepage for the Overwatch section.</p>');
	}
	// Add more specific Overwatch routes here...
	// Return 404 Response with correct headers
	const notFoundResponse = createHtmlResponse('Not Found', '<p>The requested page was not found on the Overwatch subdomain.</p>');
	return new Response(notFoundResponse.body, { status: 404, headers: notFoundResponse.headers }); // Proper 404 status
};

const app = new Elysia()
	.onRequest((context) => {
		// Get host, including port if present
		const requestHost = context.request.headers.get('Host'); // e.g., "local.lawlzer.com:3000" or "valorant.local.lawlzer.com:3000"

		let valorantFullHost: string;
		let overwatchFullHost: string;

		if (baseHostname.startsWith('local.')) {
			const domainWithoutLocal = baseHostname.substring(6);
			valorantFullHost = `local.valorant.${domainWithoutLocal}${basePort ? ':' + basePort : ''}`;
			overwatchFullHost = `local.overwatch.${domainWithoutLocal}${basePort ? ':' + basePort : ''}`;
		} else {
			valorantFullHost = `valorant.${baseHost}`;
			overwatchFullHost = `overwatch.${baseHost}`;
		}

		// Handle specific subdomains directly here
		if (requestHost === valorantFullHost) {
			// Returning directly sends the response and stops further handler matching
			return handleValorantRequest(context);
		} else if (requestHost === overwatchFullHost) {
			// Returning directly sends the response and stops further handler matching
			return handleOverwatchRequest(context);
		}

		// If it's the base domain (including port), do nothing in this hook.
		// The request will continue to the routes defined below.
		if (requestHost === baseHost) {
			// Allow request to proceed to Elysia routes
			return;
		}

		// Optional: Handle unknown hosts explicitly if needed
		// else if (host !== 'localhost' && host !== 'lawlzer.com') {
		//     context.set.status = 404;
		//     return 'Unknown Host';
		// }
	})
	// Routes defined here are now effectively only for lawlzer.com / localhost
	.get('/', () => {
		// Return Response with correct headers
		return createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>');
	})
	// Add other lawlzer.com routes here...
	// .get('/about', () => 'About lawlzer.com')

	// Fallback route if no other route matches (for lawlzer.com/localhost)
	.all('*', () => {
		// Return 404 Response with correct headers
		const notFoundResponse = createHtmlResponse('Not Found', '<p>The requested page was not found on lawlzer.com.</p>');
		return new Response(notFoundResponse.body, { status: 404, headers: notFoundResponse.headers }); // Proper 404 status
	})
	.listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
