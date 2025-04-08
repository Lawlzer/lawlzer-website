import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	const { pathname, hostname } = url;

	if (pathname.startsWith('/valorant/') && !pathname.startsWith('/valorant/api/')) {
		return NextResponse.next();
	}

	if (hostname === 'localhost' && pathname === '/valorant') {
		return NextResponse.rewrite(new URL('/valorant', request.url));
	}

	if (hostname === 'localhost' && pathname.startsWith('/valorant/')) {
		return NextResponse.next();
	}

	if (hostname.startsWith('valorant.')) {
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
