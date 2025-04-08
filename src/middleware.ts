import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	const { pathname, hostname } = url;

	if (hostname === 'localhost' && pathname === '/valorant') {
		url.pathname = '/subdomains/valorant';
		return NextResponse.rewrite(url);
	}

	if (hostname === 'localhost' && pathname.startsWith('/valorant/')) {
		const newPath = pathname.replace('/valorant', '/subdomains/valorant');
		url.pathname = newPath;
		return NextResponse.rewrite(url);
	}

	if (hostname.startsWith('valorant.')) {
		url.pathname = `/subdomains/valorant${pathname}`;
		return NextResponse.rewrite(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
