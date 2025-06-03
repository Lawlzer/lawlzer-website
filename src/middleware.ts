import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// import type { SubdomainName } from './lib/utils'; // Unused import
import { getBaseUrl, subdomains } from './lib/utils';
import { env } from './env.mjs';

// Function to determine if the hostname corresponds to the main domain
function isMainDomain(hostname: string): boolean {
	// List of hostnames that should be treated as the main domain
	const mainDomainUrl = getBaseUrl(); // Get the base URL for the main domain
	const mainDomainHostname = new URL(mainDomainUrl).hostname; // Extract hostname

	const mainDomainHostnames = ['localhost', '127.0.0.1', 'dev.localhost', mainDomainHostname]; // Add the dynamic hostname

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

	const hostHeader = request.headers.get('host');
	const forwardedHost = request.headers.get('x-forwarded-host'); // Check for x-forwarded-host

	// Prioritize x-forwarded-host, then host header, then URL hostname as fallback
	const detectedHostname = forwardedHost ?? hostHeader?.split(':')[0] ?? url.hostname;

	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Request hostname (from URL): ${url.hostname}, pathname: ${pathname}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Host header: ${hostHeader}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] X-Forwarded-Host header: ${forwardedHost}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Detected hostname: ${detectedHostname}`);

	// Check for subdomain matches
	for (const subdomain of subdomains) {
		const isSubdomainMatch = detectedHostname.startsWith(`${subdomain.name}.`);

		if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] is${subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}Subdomain: ${isSubdomainMatch}`);

		if (isSubdomainMatch) {
			if (pathname === '/') {
				if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Rewriting root path to ${subdomain.filePath}`);
				const newUrl = new URL(subdomain.filePath, request.url);
				return NextResponse.rewrite(newUrl);
			} else if (pathname.startsWith('/_next/')) {
				return NextResponse.next();
			} else {
				const subdomainBaseUrl = getBaseUrl(subdomain.name);
				if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Rewriting path to ${subdomainBaseUrl}${pathname}`);
				const newUrl = new URL(`${subdomainBaseUrl}${pathname}`, request.url);
				return NextResponse.rewrite(newUrl);
			}
		}
	}

	// Handle main domain
	if (isMainDomain(detectedHostname)) {
		if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Main domain detected. Rewriting path to /subdomains/root${pathname}`);
		const newUrl = new URL(`/subdomains/root${pathname}`, request.url);
		return NextResponse.rewrite(newUrl);
	}

	// Default case
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug('[Middleware] Not a matched domain, passing through.');
	return NextResponse.next();
}

// todo there's definitely some legacy stuff in here, like the below stuff I'm guessing

export const config = {
	// Matcher should allow /auth/ paths to run the middleware function.
	// The function itself delegates /auth/ to auth0.middleware.
	// Exclude /api, static assets, image optimization files, and metadata.
	// Updated matcher to exclude /auth/ paths since they are no longer handled
	// Also exclude paths with dots (likely static files in /public)
	matcher: [
		// Match all paths except for:
		// - api routes
		// - _next/static (static files)
		// - _next/image (image optimization files)
		// - favicon.ico (favicon file)
		// - auth routes
		// - paths containing a dot (likely static files in /public)
		'/((?!api|_next/static|_next/image|favicon.ico|auth/|.*..*).*)',
	],
};
