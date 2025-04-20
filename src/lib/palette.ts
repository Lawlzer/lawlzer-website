'use client'; // Need this for document.cookie

// import { env } from '~/env.mjs'; // REMOVED: Cannot use server env vars on client
// import { getCookieDomain } from './auth'; // REMOVED: Cannot use server env vars on client

// Define COOKIE keys
export const COOKIE_KEYS = {
	PAGE_BG: 'theme_page_bg',
	FG_COLOR: 'theme_fg_color',
	PRIMARY_COLOR: 'theme_primary_color',
	TOPBAR_BG: 'theme_topbar_bg',
};

// Define default colors
export const DEFAULT_COLORS = {
	PAGE_BG: '#640175',
	FG_COLOR: '#f0e0f8',
	PRIMARY_COLOR: '#bb0fd9',
	TOPBAR_BG: '#3b0047',
};

// Helper function to get the base domain (e.g., example.com) from hostname
function getBaseDomain(): string | null {
	if (typeof window === 'undefined') return null; // Not in browser

	const hostname = window.location.hostname;
	if (hostname === 'localhost') {
		return null; // No domain for localhost
	}

	// Simple logic to get the last two parts (e.g., example.com from sub.example.com)
	// Might need adjustment for complex TLDs (e.g., .co.uk)
	const parts = hostname.split('.');
	if (parts.length < 2) {
		return hostname; // Handle cases like single-word domains if necessary
	}
	return parts.slice(-2).join('.');
}

// Helper function to set cookies client-side
export function setCookie(name: string, value: string, days: number = 365): void {
	try {
		let expires = '';
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = '; expires=' + date.toUTCString();
		}
		// Add domain based on current hostname for client-side setting
		const domain = getBaseDomain();
		const domainAttribute = domain ? `; domain=${domain}` : ''; // Add dot prefix if needed based on browser behavior
		document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax' + domainAttribute;
	} catch (error) {
		console.error('Failed to set cookie:', name, error);
	}
}

// Helper function to get cookies client-side
export function getCookie(name: string): string | null {
	// Check if running in a browser environment
	if (typeof document === 'undefined') {
		return null; // document is not available (e.g., server-side rendering)
	}
	try {
		const nameEQ = name + '=';
		const ca = document.cookie.split(';');
		// Use for-of loop for cleaner iteration
		for (let c of ca) {
			// Trim leading spaces
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

// Define Predefined Color Palettes
export const PREDEFINED_PALETTES = {
	'Light Mode': {
		PAGE_BG: '#ffffff',
		FG_COLOR: '#111827',
		PRIMARY_COLOR: '#3c33e6',
		TOPBAR_BG: '#f2f2f2',
	},
	'Dark Mode': {
		PAGE_BG: '#1f2937',
		FG_COLOR: '#f9fafb',
		PRIMARY_COLOR: '#818cf8',
		TOPBAR_BG: '#374151',
	},
	'Vibrant Fun': {
		PAGE_BG: '#ec4899',
		FG_COLOR: '#1e293b',
		PRIMARY_COLOR: '#8b5cf6',
		TOPBAR_BG: '#fef3c7',
	},
	'Ocean Breeze': {
		PAGE_BG: '#e0f2fe',
		FG_COLOR: '#075985',
		PRIMARY_COLOR: '#38bdf8',
		TOPBAR_BG: '#bae6fd',
	},
	'Forest Calm': {
		PAGE_BG: '#f0fdf4',
		FG_COLOR: '#166534',
		PRIMARY_COLOR: '#4ade80',
		TOPBAR_BG: '#dcfce7',
	},
	'All Black': {
		PAGE_BG: '#000000',
		FG_COLOR: '#000000',
		PRIMARY_COLOR: '#000000',
		TOPBAR_BG: '#000000',
	},
	'All White': {
		PAGE_BG: '#ffffff',
		FG_COLOR: '#ffffff',
		PRIMARY_COLOR: '#ffffff',
		TOPBAR_BG: '#ffffff',
	},
};
