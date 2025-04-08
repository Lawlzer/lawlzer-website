import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from './env';

export function middleware(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	const { pathname } = url;
	const hostHeader = request.headers.get('host');
	const detectedHostname = hostHeader?.split(':')[0] ?? url.hostname;

	console.log(`[Middleware] Request hostname (from URL): ${url.hostname}, pathname: ${pathname}`);
	console.log(`[Middleware] Host header: ${hostHeader}`);
	console.log(`[Middleware] Detected hostname (from Host header): ${detectedHostname}`);

	const isValorantSubdomain = detectedHostname === 'valorant.localhost.com' || detectedHostname === 'valorant.lawlzer.com' || detectedHostname.startsWith('valorant.');

	console.log(`[Middleware] isValorantSubdomain: ${isValorantSubdomain}`);

	if (isValorantSubdomain) {
		if (pathname === '/') {
			console.log('[Middleware] Rewriting root path to /valorant');
			const newUrl = new URL('/valorant', request.url);
			return NextResponse.rewrite(newUrl);
		}

		if (pathname.startsWith('/_next/')) {
			return NextResponse.next();
		}

		console.log(`[Middleware] Rewriting path to /valorant${pathname}`);
		const newUrl = new URL(`/valorant${pathname}`, request.url);
		return NextResponse.rewrite(newUrl);
	}

	console.log('[Middleware] Not a Valorant subdomain, passing through.');
	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
