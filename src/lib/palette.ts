'use client'; // Need this for document.cookie

// REMOVED: Cannot use server env vars on client
// import { env } from '~/env.mjs';
// import { getCookieDomain } from './auth';

// Define COOKIE keys
export const COOKIE_KEYS = {
	PAGE_BG: 'theme_page_bg',
	PRIMARY_TEXT_COLOR: 'theme_primary_text_color',
	PRIMARY_COLOR: 'theme_primary_color',
	SECONDARY_COLOR: 'theme_secondary_color',
	SECONDARY_TEXT_COLOR: 'theme_secondary_text_color',
	BORDER_COLOR: 'theme_border_color',
};

// Define default colors
export const DEFAULT_COLORS = {
	PAGE_BG: '#640175',
	PRIMARY_TEXT_COLOR: '#f0e0f8',
	PRIMARY_COLOR: '#bb0fd9',
	SECONDARY_COLOR: '#3b0047',
	SECONDARY_TEXT_COLOR: '#c0a0c8',
	BORDER_COLOR: '#450052',
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
	// Return the parent domain (e.g., example.com) - a leading dot is often implied by browsers
	return parts.slice(-2).join('.');
}

// Helper function to set cookies client-side, scoped to the base domain
export function setCookie(name: string, value: string, days: number = 365): void {
	if (typeof document === 'undefined') {
		console.warn('Cannot set cookie outside browser environment');
		return;
	}
	try {
		let expires = '';
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = '; expires=' + date.toUTCString();
		}
		// Add domain based on current hostname for client-side setting
		const domain = getBaseDomain();
		// Setting domain=example.com makes it available to sub.example.com
		const domainAttribute = domain ? `; domain=${domain}` : '';
		document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax${domainAttribute}`;
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
		const nameEQ = name + '=';
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

// Define Predefined Color Palettes
export const PREDEFINED_PALETTES = {
	'Light Mode': {
		PAGE_BG: '#ffffff',
		PRIMARY_TEXT_COLOR: '#111827',
		PRIMARY_COLOR: '#3c33e6',
		SECONDARY_COLOR: '#f2f2f2',
		SECONDARY_TEXT_COLOR: '#6b7280',
		BORDER_COLOR: '#e5e7eb',
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
	'Vibrant Fun': {
		PAGE_BG: '#ec4899',
		PRIMARY_TEXT_COLOR: '#1e293b',
		PRIMARY_COLOR: '#8b5cf6',
		SECONDARY_COLOR: '#fef3c7',
		SECONDARY_TEXT_COLOR: '#4b5563',
		BORDER_COLOR: '#c026d3',
	},
	'Ocean Breeze': {
		PAGE_BG: '#e0f2fe',
		PRIMARY_TEXT_COLOR: '#075783',
		PRIMARY_COLOR: '#00b3ff',
		SECONDARY_COLOR: '#7ecffb',
		SECONDARY_TEXT_COLOR: '#0369a1',
		BORDER_COLOR: '#7dd3fc',
	},
	'Forest Calm': {
		PAGE_BG: '#d5f1dd',
		PRIMARY_TEXT_COLOR: '#0d4522',
		PRIMARY_COLOR: '#4ade80',
		SECONDARY_COLOR: '#3c724f',
		SECONDARY_TEXT_COLOR: '#24c25e',
		BORDER_COLOR: '#0c7332',
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
