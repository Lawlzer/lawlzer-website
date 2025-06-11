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

	// Build the list of main domain hostnames dynamically
	// Include localhost, 127.0.0.1, and the configured main domain
	const mainDomainHostnames = ['localhost', '127.0.0.1'];

	// Add the main domain hostname if it's not already in the list
	if (!mainDomainHostnames.includes(mainDomainHostname)) {
		mainDomainHostnames.push(mainDomainHostname);
	}

	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[isMainDomain] Input hostname: ${hostname}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[isMainDomain] Calculated mainDomainHostnames: ${JSON.stringify(mainDomainHostnames)}`);
	const result = mainDomainHostnames.includes(hostname);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[isMainDomain] Result: ${result}`);
	return result;
}

// Make the middleware async to await auth0.middleware
export function middleware(request: NextRequest): NextResponse {
	console.debug('[Middleware] Running middleware for:', request.url);

	const url = request.nextUrl.clone();
	const { pathname } = url;

	const hostHeader = request.headers.get('host');
	const forwardedHost = request.headers.get('x-forwarded-host'); // Check for x-forwarded-host

	// Prioritize x-forwarded-host, then host header, then URL hostname as fallback
	const detectedHostnameWithPort = forwardedHost ?? hostHeader ?? url.hostname;
	// Strip port from hostname for comparison
	const detectedHostname = detectedHostnameWithPort.split(':')[0];

	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Request hostname (from URL): ${url.hostname}, pathname: ${pathname}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Host header: ${hostHeader}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] X-Forwarded-Host header: ${forwardedHost}`);
	if (env.DEBUG_SUBDOMAIN_VALUE) console.debug(`[Middleware] Detected hostname: ${detectedHostname}`);

	// Development-only redirect from localhost to the configured main domain
	console.debug('[Middleware] NODE_ENV:', env.NODE_ENV, 'detectedHostname:', detectedHostname);
	if (env.NODE_ENV === 'development' && detectedHostname === 'localhost') {
		// Build the redirect URL dynamically using environment configuration
		const redirectUrl = new URL(request.url);

		// Get the base URL without a subdomain to extract the second-level domain
		const baseUrl = getBaseUrl();
		const urlParts = new URL(baseUrl);

		// Extract the hostname parts from the base URL
		// For example, if NEXT_PUBLIC_SECOND_LEVEL_DOMAIN is "dev", this would be "dev.localhost"
		const fullHostname = urlParts.hostname;
		redirectUrl.hostname = fullHostname;
		redirectUrl.port = urlParts.port;

		console.debug(`[Middleware] Development redirect: localhost -> ${fullHostname}`);
		console.debug(`[Middleware] Redirecting to: ${redirectUrl.toString()}`);

		if (env.DEBUG_SUBDOMAIN_VALUE) {
			console.debug(`[Middleware] Development redirect: localhost -> ${fullHostname}`);
			console.debug(`[Middleware] Redirecting to: ${redirectUrl.toString()}`);
		}

		return NextResponse.redirect(redirectUrl);
	}

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
