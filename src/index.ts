import { Elysia } from 'elysia';
import type { UrlConfig, Subdomain } from './types'; // Import types
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

const dynamicBaseHost = baseHost; // The host the server should actually listen on/match
const dynamicValorantHost = `${valorantSubdomain}${basePort ? ':' + basePort : ''}`;
const dynamicOverwatchHost = `${overwatchSubdomain}${basePort ? ':' + basePort : ''}`;

const navUrls: UrlConfig = {
	home: `${parsedBaseUrl.protocol}//${baseHostname}${displayPortString}`,
	valorant: `${parsedBaseUrl.protocol}//${valorantSubdomain}${displayPortString}`,
	overwatch: `${parsedBaseUrl.protocol}//${overwatchSubdomain}${displayPortString}`,
};

const app = new Elysia()
	.derive((context): { subdomain: Subdomain } => {
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
	.get('/', ({ subdomain, set }) => {
		switch (subdomain) {
			case 'base':
				// Pass navUrls to createHtmlResponse
				return createHtmlResponse('Welcome to Lawlzer.com', '<p>This is the main homepage.</p>', navUrls);
			case 'valorant':
				// Use imported handler
				return handleValorantHome(navUrls);
			case 'overwatch':
				// Use imported handler
				return handleOverwatchHome(navUrls);
			default:
				set.status = 404; // Or perhaps a 400 Bad Request if the host is totally wrong
				// Pass navUrls to createHtmlResponse
				return createHtmlResponse('Unknown Host', '<p>The requested host is not recognized.</p>', navUrls);
		}
	})
	.all('*', ({ set }) => {
		set.status = 404;
		return createHtmlResponse('Not Found', '<p>The requested page was not found.</p>', navUrls);
	})
	.listen(basePort ? parseInt(basePort) : 3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
