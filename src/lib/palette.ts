'use client'; // Need this for document.cookie

// Define COOKIE keys
export const COOKIE_KEYS = {
	PAGE_BG: 'theme_page_bg',
	PRIMARY_TEXT_COLOR: 'theme_primary_text_color',
	PRIMARY_COLOR: 'theme_primary_color',
	SECONDARY_COLOR: 'theme_secondary_color',
	SECONDARY_TEXT_COLOR: 'theme_secondary_text_color',
	BORDER_COLOR: 'theme_border_color',
};

// Define Predefined Color Palettes
export const PREDEFINED_PALETTES = {
	'Light Mode': {
		PAGE_BG: '#fafaf9',
		PRIMARY_TEXT_COLOR: '#1a1a1a',
		PRIMARY_COLOR: '#5b51e5',
		SECONDARY_COLOR: '#f5f5f4',
		SECONDARY_TEXT_COLOR: '#71717a',
		BORDER_COLOR: '#e4e4e7',
	},
	'Dark Mode': {
		PAGE_BG: '#1f2937',
		PRIMARY_TEXT_COLOR: '#f9fafb',
		PRIMARY_COLOR: '#818cf8',
		SECONDARY_COLOR: '#374151',
		SECONDARY_TEXT_COLOR: '#9ca3af',
		BORDER_COLOR: '#4b5563',
	},
	'Darker Mode': {
		PAGE_BG: '#000000',
		PRIMARY_TEXT_COLOR: '#ffffff',
		PRIMARY_COLOR: '#808399',
		SECONDARY_COLOR: '#212121',
		SECONDARY_TEXT_COLOR: '#95a0b1',
		BORDER_COLOR: '#787878',
	},
	'Soft Pastel': {
		PAGE_BG: '#fefbf9',
		PRIMARY_TEXT_COLOR: '#4a5568',
		PRIMARY_COLOR: '#9f7aea',
		SECONDARY_COLOR: '#f7e8ff',
		SECONDARY_TEXT_COLOR: '#718096',
		BORDER_COLOR: '#e2d9f3',
	},
	'Ocean Breeze': {
		PAGE_BG: '#f0f9ff',
		PRIMARY_TEXT_COLOR: '#1e40af',
		PRIMARY_COLOR: '#3b82f6',
		SECONDARY_COLOR: '#e0f2fe',
		SECONDARY_TEXT_COLOR: '#475569',
		BORDER_COLOR: '#bae6fd',
	},
	'Forest Calm': {
		PAGE_BG: '#f0fdf4',
		PRIMARY_TEXT_COLOR: '#166534',
		PRIMARY_COLOR: '#22c55e',
		SECONDARY_COLOR: '#dcfce7',
		SECONDARY_TEXT_COLOR: '#15803d',
		BORDER_COLOR: '#86efac',
	},
	'All Black': {
		PAGE_BG: '#000000',
		PRIMARY_TEXT_COLOR: '#000000',
		PRIMARY_COLOR: '#000000',
		SECONDARY_COLOR: '#000000',
		SECONDARY_TEXT_COLOR: '#000000',
		BORDER_COLOR: '#000000',
	},
	'All White': {
		PAGE_BG: '#ffffff',
		PRIMARY_TEXT_COLOR: '#ffffff',
		PRIMARY_COLOR: '#ffffff',
		SECONDARY_COLOR: '#ffffff',
		SECONDARY_TEXT_COLOR: '#ffffff',
		BORDER_COLOR: '#ffffff',
	},
};

// Define default colors (Fallback)
export const LIGHT_MODE_COLORS = PREDEFINED_PALETTES['Light Mode'];
export const DARK_MODE_COLORS = PREDEFINED_PALETTES['Dark Mode'];

// Function to get default colors based on system preference
export function getDefaultColors(): typeof LIGHT_MODE_COLORS {
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return DARK_MODE_COLORS;
	}
	// Default to light mode if preference cannot be determined or is light
	return LIGHT_MODE_COLORS;
}

// Helper function to get the base domain for cookie sharing
function getBaseDomain(): string | null {
	if (typeof window === 'undefined') return null; // Not in browser

	const { hostname } = window.location;

	// For localhost development with subdomains, extract the base domain
	if (hostname.includes('localhost')) {
		const parts = hostname.split('.');

		// If we have subdomains like colors.eeeeee.localhost
		if (parts.length > 2) {
			// Extract everything after the first subdomain
			// colors.eeeeee.localhost → .eeeeee.localhost
			const baseDomain = `.${parts.slice(1).join('.')}`;
			console.debug('Cookie domain for localhost:', baseDomain, 'from hostname:', hostname);
			return baseDomain;
		}

		// For simple localhost or single subdomain, don't set domain
		return null;
	}

	// For Vercel deployments (*.vercel.app), use the full hostname
	if (hostname.endsWith('.vercel.app')) {
		return hostname;
	}

	// Extract the base domain for cookie sharing across all subdomains
	try {
		const parts = hostname.split('.');

		// For any subdomain setup, we want cookies shared at the base domain level
		// Examples:
		// - colors.staging.lawlzer.com → .lawlzer.com
		// - staging.lawlzer.com → .lawlzer.com
		// - lawlzer.com → .lawlzer.com
		// - localhost → null (no domain attribute)

		if (parts.length >= 2) {
			// Always use the last two parts as the base domain
			const baseDomain = parts.slice(-2).join('.');

			// Validate it's a proper domain (contains a dot)
			if (baseDomain.includes('.') && !baseDomain.includes('localhost')) {
				const cookieDomain = `.${baseDomain}`;
				console.debug('Cookie domain:', cookieDomain, 'from hostname:', hostname);
				return cookieDomain;
			}
		}

		// For single-part domains or localhost, don't set domain attribute
		console.debug('No domain attribute for cookies on:', hostname);
		return null;
	} catch (error) {
		console.error('Error determining base domain:', error);
		// Fallback to extracting from hostname
		const parts = hostname.split('.');
		if (parts.length < 2) {
			return hostname;
		}
		// Add leading dot for cross-subdomain sharing
		return `.${parts.slice(-2).join('.')}`;
	}
}

// Helper function to set cookies client-side, scoped to the base domain
export function setCookie(name: string, value: string, days = 365): void {
	if (typeof document === 'undefined') {
		console.warn('Cannot set cookie outside browser environment');
		return;
	}
	try {
		let expires = '';
		if (days > 0) {
			const date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = `; expires=${date.toUTCString()}`;
		}
		// Add domain based on current hostname for client-side setting
		const domain = getBaseDomain();
		// Setting domain=example.com makes it available to sub.example.com
		const domainAttribute = domain !== null ? `; domain=${domain}` : '';
		const cookieString = `${name}=${value || ''}${expires}; path=/; SameSite=Lax${domainAttribute}`;

		// Debug logging
		console.debug('Setting cookie:', {
			name,
			value: `${value?.substring(0, 10)}...`, // Truncate for privacy
			domain,
			hostname: window.location.hostname,
			cookieString,
		});

		document.cookie = cookieString;
	} catch (error) {
		console.error('Failed to set cookie:', name, error);
	}
}

// Helper function to get cookies client-side
export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') {
		return null; // document is not available (e.g., server-side rendering)
	}
	try {
		const nameEQ = `${name}=`;
		const ca = document.cookie.split(';');
		for (let c of ca) {
			c = c.trimStart();
			if (c.startsWith(nameEQ)) {
				return c.substring(nameEQ.length);
			}
		}
		return null;
	} catch (error) {
		console.error('Failed to get cookie:', name, error);
		return null;
	}
}

// REMOVED: LocalStorage functions
// export function setLocalStorageItem(...) { ... }
// export function getLocalStorageItem(...) { ... }
