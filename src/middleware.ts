import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	const { pathname, hostname } = url;

	const isValorantSubdomain = hostname.startsWith('valorant.') || (hostname === 'localhost' && pathname.startsWith('/valorant'));

	if (hostname === 'localhost' && pathname.startsWith('/valorant')) {
		url.pathname = pathname.replace('/valorant', '');
		url.pathname = `/subdomains/valorant${url.pathname}`;
		return NextResponse.rewrite(url);
	}

	if (isValorantSubdomain) {
		url.pathname = `/subdomains/valorant${pathname}`;
		return NextResponse.rewrite(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
