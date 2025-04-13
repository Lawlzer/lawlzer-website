import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from './env.mjs';
import { getBaseUrl } from './lib/utils';

// Function to determine if the hostname corresponds to the main domain
function isMainDomain(hostname: string): boolean {
	// List of hostnames that should be treated as the main domain
	const mainDomainHostnames = [
		'localhost',
		'127.0.0.1',
		// env.NEXT_PUBLIC_BASE_URL?.split('//')[1], // Temporarily removed for debugging
		'lawlzer.com',
		'www.lawlzer.com',
		'local',
		'local:3000',
		'example.test',
		'test',
		'dev.localhost',
	].filter(Boolean); // Filter out potential undefined/null values\
	// todo clean up mainDomainHostnames

	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[isMainDomain] Input hostname: ${hostname}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[isMainDomain] Calculated mainDomainHostnames: ${JSON.stringify(mainDomainHostnames)}`);
	const result = mainDomainHostnames.includes(hostname);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[isMainDomain] Result: ${result}`);
	return result;
}

// Make the middleware async to await auth0.middleware
export function middleware(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	const { pathname } = url;

	if (true as unknown as any) console.debug(`[Middleware] Cookies: ${JSON.stringify(request.cookies.getAll())}`);

	const hostHeader = request.headers.get('host');
	const detectedHostname = hostHeader?.split(':')[0] ?? url.hostname;

	let response: NextResponse;

	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Request hostname (from URL): ${url.hostname}, pathname: ${pathname}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Host header: ${hostHeader}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Detected hostname (from Host header): ${detectedHostname}`);

	const isValorantSubdomain = detectedHostname.startsWith('valorant.');

	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] isValorantSubdomain: ${isValorantSubdomain}`);

	if (isValorantSubdomain) {
		if (pathname === '/') {
			if (env.DEBUG_SUBDOMAIN_VALUE) console.debug('[Middleware] Rewriting root path to /valorant');
			const newUrl = new URL('/subdomains/valorant', request.url);
			response = NextResponse.rewrite(newUrl);
		} else if (pathname.startsWith('/_next/')) {
			// console.log(`pathname starts with /_next/, doing SPECIAL STUFF`); // Removed noisy log
			response = NextResponse.next();
		} else {
			const valorantSubdomain = getBaseUrl('valorant');
			if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Rewriting path to ${valorantSubdomain}${pathname}`);
			const newUrl = new URL(`${valorantSubdomain}${pathname}`, request.url);
			response = NextResponse.rewrite(newUrl);
		}
	} else if (isMainDomain(detectedHostname)) {
		if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Main domain detected. Rewriting path to /subdomains/root${pathname}`);
		const newUrl = new URL(`/subdomains/root${pathname}`, request.url);
		response = NextResponse.rewrite(newUrl);
	} else {
		if (env.DEBUG_SUBDOMAIN_VALUE) console.debug('[Middleware] Not a matched domain, passing through.');
		response = NextResponse.next();
	}

	return response;
}

// todo there's definitely some legacy stuff in here, like the below stuff I'm guessing

export const config = {
	// Matcher should allow /auth/ paths to run the middleware function.
	// The function itself delegates /auth/ to auth0.middleware.
	// Exclude /api, static assets, image optimization files, and metadata.
	// Updated matcher to exclude /auth/ paths since they are no longer handled
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/).*)'],
};
