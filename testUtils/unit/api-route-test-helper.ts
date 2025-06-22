import type { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TestOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: any;
	searchParams?: Record<string, string>;
}

type RouteHandler = (request: NextRequest) => NextResponse | Promise<NextResponse>;

export async function testRoute(
	handler: {
		GET?: RouteHandler;
		POST?: RouteHandler;
		PUT?: RouteHandler;
		DELETE?: RouteHandler;
	},
	url: string,
	options: TestOptions = {}
): Promise<NextResponse> {
	const { method = 'GET', headers = {}, body, searchParams } = options;

	// Build the full URL with search params
	const urlObj = new URL(url, 'http://localhost:3000');
	if (searchParams) {
		Object.entries(searchParams).forEach(([key, value]) => {
			urlObj.searchParams.set(key, value);
		});
	}

	// Create a mock NextRequest without using the constructor directly
	const mockRequest = {
		url: urlObj.toString(),
		method,
		headers: new Headers(headers),
		nextUrl: urlObj,
		cookies: {
			get: (name: string) => {
				const cookieHeader = headers.cookie || '';
				const cookies = cookieHeader.split(';').map((c) => c.trim());
				const cookie = cookies.find((c) => c.startsWith(`${name}=`));
				if (cookie !== undefined) {
					const value = cookie.split('=')[1];
					// Decode the cookie value like Next.js does
					return { name, value: decodeURIComponent(value) };
				}
				return undefined;
			},
			getAll: () => [],
			set: () => {},
			delete: () => {},
		},
		json: async () => body as unknown,
		text: async () => JSON.stringify(body),
	} as unknown as NextRequest;

	// Get the appropriate handler
	const handlerFn = handler[method as keyof typeof handler];
	if (!handlerFn) {
		throw new Error(`Handler for ${method} not found`);
	}

	// Call the handler
	const response = await handlerFn(mockRequest);

	return response;
}

export function getCookies(response: NextResponse): Record<string, string> {
	const cookies: Record<string, string> = {};
	const setCookieHeaders = response.headers.getSetCookie();

	setCookieHeaders.forEach((cookieString) => {
		const [nameValue] = cookieString.split(';');
		const [name, value] = nameValue.split('=');
		cookies[name] = value;
	});

	return cookies;
}
