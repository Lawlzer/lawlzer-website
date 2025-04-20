import { env } from '~/env.mjs';

function throwError(message: string): never {
	throw new Error(message);
}

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

	// Construct the base URL from parts
	const protocol = env.NEXT_PUBLIC_SCHEME ?? throwError('No process.env.NEXT_PUBLIC_SCHEME found');
	const secondLevel = env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN ?? throwError('No process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN found');
	const topLevel = env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN ?? throwError('No process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN found');
	let port = env.NEXT_PUBLIC_FRONTEND_PORT ?? throwError('No process.env.NEXT_PUBLIC_FRONTEND_PORT found');

	if (port === '80' || port === '443') port = '';

	let subdomainText = '';
	if (subdomain !== 'root') subdomainText = `${subdomain}.`;

	return `${protocol}://${subdomainText}${secondLevel}.${topLevel}${port ? `:${port}` : ''}${path}`;
}

export function getBaseUrl(subdomain?: 'colors' | 'valorant' | null): string {
	const protocol = env.NEXT_PUBLIC_SCHEME ?? throwError('No process.env.NEXT_PUBLIC_SCHEME found');
	const secondLevel = env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN ?? throwError('No process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN found');
	const topLevel = env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN ?? throwError('No process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN found');
	let port = env.NEXT_PUBLIC_FRONTEND_PORT ?? throwError('No process.env.NEXT_PUBLIC_FRONTEND_PORT found');

	if (port === '80' || port === '443') port = '';

	let subdomainText = '';
	if (subdomain) subdomainText = `${subdomain}.`;

	// Special case for localhost
	if (secondLevel === 'localhost') {
		return `${protocol}://${secondLevel}${port ? `:${port}` : ''}`;
	}

	return `${protocol}://${subdomainText}${secondLevel}.${topLevel}${port ? `:${port}` : ''}`;
}
