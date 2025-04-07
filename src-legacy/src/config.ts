import { throwError } from '@lawlzer/utils';
import type { UrlConfig } from './types';

export const MONGODB_URI = process.env.MONGODB_URI ?? throwError('MONGODB_URI environment variable is not set.');

// Base URL is needed for fallback redirect URI
export const BASE_URL = process.env.BASE_URL ?? throwError('BASE_URL environment variable is not set.');
export const FRONTEND_PORT = process.env.FRONTEND_PORT; // Optional

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? throwError('GOOGLE_CLIENT_ID environment variable is not set.');
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? throwError('GOOGLE_CLIENT_SECRET environment variable is not set.');

// Use explicit GOOGLE_REDIRECT_URI if provided, otherwise construct from BASE_URL
export const GOOGLE_REDIRECT_URI =
	process.env.GOOGLE_REDIRECT_URI ??
	// Ensure BASE_URL doesn't end with a slash before appending
	(BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL) + '/login/google/callback';

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? throwError('DISCORD_CLIENT_ID environment variable is not set.');
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? throwError('DISCORD_CLIENT_SECRET environment variable is not set.');

// Similar logic for Discord redirect URI (assuming same pattern)
export const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI ?? (BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL) + '/login/discord/callback';

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? throwError('GITHUB_CLIENT_ID environment variable is not set.');
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? throwError('GITHUB_CLIENT_SECRET environment variable is not set.');

// Similar logic for GitHub redirect URI
export const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI ?? (BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL) + '/login/github/callback';

// Determine if running in production
export const PRODUCTION = process.env.PRODUCTION === 'true';

// --- Domain & URL Configuration --- //

let parsedBaseUrl: URL;
try {
	parsedBaseUrl = new URL(BASE_URL);
} catch (error) {
	throw new Error(`Invalid BASE_URL: ${BASE_URL}`);
}

export const baseHostname = parsedBaseUrl.hostname;
export const basePort = parsedBaseUrl.port;
// const baseOrigin = parsedBaseUrl.origin; // Not currently used externally
export const baseHost = basePort ? `${baseHostname}:${basePort}` : baseHostname; // hostname:port or just hostname

export const displayPort = FRONTEND_PORT || basePort; // Use frontend port if specified, else backend port
export const displayPortString = displayPort ? `:${displayPort}` : '';

export const isLocal = baseHostname.startsWith('local.');
export const coreDomain = isLocal ? baseHostname.substring(6) : baseHostname;

export const valorantSubdomain = isLocal ? `local.valorant.${coreDomain}` : `valorant.${coreDomain}`;
export const overwatchSubdomain = isLocal ? `local.overwatch.${coreDomain}` : `overwatch.${coreDomain}`;

// These represent the actual host:port the server needs to match
export const dynamicBaseHost = baseHost;
export const dynamicValorantHost = `${valorantSubdomain}${basePort ? ':' + basePort : ''}`;
export const dynamicOverwatchHost = `${overwatchSubdomain}${basePort ? ':' + basePort : ''}`;

// These represent the URLs to be displayed in the nav bar (potentially different port)
export const navUrls: UrlConfig = {
	home: `${parsedBaseUrl.protocol}//${baseHostname}${displayPortString}`,
	valorant: `${parsedBaseUrl.protocol}//${valorantSubdomain}${displayPortString}`,
	overwatch: `${parsedBaseUrl.protocol}//${overwatchSubdomain}${displayPortString}`,
};

// --- Debug Flags --- //
export const DEBUG_CONTEXT_KEYS = process.env.DEBUG_CONTEXT_KEYS === 'true';
export const DEBUG_SUBDOMAIN_VALUE = process.env.DEBUG_SUBDOMAIN_VALUE === 'true';
export const DEBUG_SESSION_STUFF = process.env.DEBUG_SESSION_STUFF === 'true';
