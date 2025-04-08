import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from './env';

export function middleware(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	const { pathname, hostname } = url;

	const isValorantSubdomain = hostname === 'valorant.localhost' || hostname === 'valorant.lawlzer.com' || hostname.startsWith('valorant.');

	if (isValorantSubdomain) {
		if (pathname === '/') {
			return NextResponse.rewrite(new URL('/valorant', request.url));
		}
		return NextResponse.rewrite(new URL(`/valorant${pathname}`, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
