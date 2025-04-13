import { env } from '~/env.mjs';

export function pathToURLTestsOnly(filePath: string): string {
	// Normalize path separators for consistency, although Windows paths might need more handling if they appear differently
	const normalizedPath = filePath.replace(/\\\\/g, '/');
	const marker = 'src/app/subdomains/';
	const markerIndex = normalizedPath.indexOf(marker);

	if (markerIndex === -1) {
		throw new Error(`Could not find '${marker}' in filePath: ${filePath}`);
	}

	const relevantPathPart = normalizedPath.substring(markerIndex + marker.length); // e.g., "valorant/page.tsx" or "blog/posts/my-post/page.tsx"
	const pathSegments = relevantPathPart.split('/'); // e.g., ["valorant", "page.tsx"] or ["blog", "posts", "my-post", "page.tsx"]

	if (pathSegments.length === 0) {
		throw new Error(`Could not parse subdomain and path from relevantPathPart: ${relevantPathPart}`);
	}

	const subdomain = pathSegments[0];
	const remainingSegments = pathSegments.slice(1);

	// Check if the last segment is a 'page' file (e.g., page.tsx, page.js) and remove it
	if (remainingSegments.length > 0) {
		const lastSegment = remainingSegments[remainingSegments.length - 1];
		// Check if it starts with 'page.' and contains a dot.
		if (lastSegment.startsWith('page.') && lastSegment.includes('.')) {
			remainingSegments.pop();
		}
	}

	// Construct the path string
	const path = remainingSegments.length > 0 ? `/${remainingSegments.join('/')}` : '/';

	// Extract protocol and clean the base URL
	const protocolMatch = /^(https?:\/\/)/.exec(env.NEXT_PUBLIC_BASE_URL);
	const protocol = protocolMatch ? protocolMatch[0] : 'http://'; // Default to http if no match (should not happen with valid URL)
	const cleanedBaseUrl = env.NEXT_PUBLIC_BASE_URL.replace(/^(https?:\/\/)/, '');

	return `${protocol}${subdomain !== 'root' ? `${subdomain}.` : ''}${cleanedBaseUrl}:${env.NEXT_PUBLIC_FRONTEND_PORT}${path}`;
}

// Helper function to parse URL parts
function parseUrl(url: string): { protocol: string | null; host: string } {
	const protocolMatch = /^(https?:)\/\//.exec(url);
	const protocol = protocolMatch ? protocolMatch[1] : null;
	const host = url.replace(/^(https?:)?\/\//, '');

	return { protocol, host };
}

export function getBaseUrl(subdomain?: 'valorant' | null): string {
	if (subdomain) {
		const urlParts = parseUrl(env.NEXT_PUBLIC_BASE_URL);
		const protocol = urlParts.protocol ? `${urlParts.protocol}//` : '';
		const baseWithSubdomain = `${protocol}${subdomain}.${urlParts.host}`;

		if (env.NEXT_PUBLIC_FRONTEND_PORT === '80') return baseWithSubdomain;

		return `${baseWithSubdomain}:${env.NEXT_PUBLIC_FRONTEND_PORT}`;
	}

	if (env.NEXT_PUBLIC_FRONTEND_PORT === '80') return String(env.NEXT_PUBLIC_BASE_URL);

	return `${env.NEXT_PUBLIC_BASE_URL}:${env.NEXT_PUBLIC_FRONTEND_PORT}`;
}
