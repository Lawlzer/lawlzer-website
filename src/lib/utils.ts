import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { env } from '~/env.mjs';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Converts camelCase, snake_case, or PascalCase strings to Title Case with spaces
 * @param str - The string to convert
 * @returns The converted string in Title Case
 * @example
 * formatFieldName('activeChartTab') // 'Active Chart Tab'
 * formatFieldName('temperature_data') // 'Temperature Data'
 * formatFieldName('maxValue') // 'Max Value'
 * formatFieldName('HTTPResponse') // 'HTTP Response'
 */
export function formatFieldName(str: string): string {
	if (!str) return '';

	// First handle snake_case by replacing underscores with spaces
	let result = str.replace(/_/g, ' ');

	// Then handle camelCase and PascalCase
	// Insert space before uppercase letters that follow lowercase letters or numbers
	result = result.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

	// Handle consecutive uppercase letters (e.g., HTTPResponse -> HTTP Response)
	result = result.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

	// Capitalize the first letter of each word
	result = result.replace(/\b\w/g, (char) => char.toUpperCase());

	// Clean up any double spaces
	result = result.replace(/\s+/g, ' ').trim();

	return result;
}

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

export interface Subdomain {
	name: string;
	filePath: string;
}

export const subdomains: Subdomain[] = [
	{ name: 'valorant', filePath: '/subdomains/valorant' },
	{ name: 'colors', filePath: '/subdomains/colors' },
	{ name: 'staging', filePath: '/subdomains/root' },
];

export type SubdomainName = (typeof subdomains)[number]['name'];

export function getBaseUrl(subdomain?: SubdomainName | null): string {
	const protocol = env.NEXT_PUBLIC_SCHEME ?? throwError('No process.env.NEXT_PUBLIC_SCHEME found');
	const secondLevel = env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN ?? throwError('No process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN found');
	const topLevel = env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN ?? throwError('No process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN found');
	let port = env.NEXT_PUBLIC_FRONTEND_PORT ?? throwError('No process.env.NEXT_PUBLIC_FRONTEND_PORT found');

	if (port === '80' || port === '443') port = '';

	let subdomainText = '';
	if (subdomain !== undefined && subdomain !== null) subdomainText = `${subdomain}.`;

	// Special case for localhost development
	if (topLevel === 'localhost') {
		// For localhost, build the URL as subdomain.secondLevel.localhost:port
		// But if no subdomain and secondLevel is 'localhost', use just localhost:port
		if ((subdomain === undefined || subdomain === null) && secondLevel === 'localhost') {
			return `${protocol}://localhost${port !== '' ? `:${port}` : ''}`;
		}
		return `${protocol}://${subdomainText}${secondLevel}.${topLevel}${port !== '' ? `:${port}` : ''}`;
	}

	// Special case for when secondLevel is localhost (legacy support)
	if (secondLevel === 'localhost') {
		return `${protocol}://${subdomainText}${secondLevel}${port !== '' ? `:${port}` : ''}`;
	}

	return `${protocol}://${subdomainText}${secondLevel}.${topLevel}${port !== '' ? `:${port}` : ''}`;
}
