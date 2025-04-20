'use client';

import { useEffect } from 'react';
import { COOKIE_KEYS, getCookie } from '~/lib/palette';

// Map COOKIE_KEYS to CSS variable names
// Ensure these CSS variable names match those defined in globals.css
const cookieToCssVarMap: Record<string, string> = {
	[COOKIE_KEYS.PAGE_BG]: '--page-background',
	[COOKIE_KEYS.PRIMARY_TEXT_COLOR]: '--primary-text-color',
	[COOKIE_KEYS.PRIMARY_COLOR]: '--primary-color',
	[COOKIE_KEYS.SECONDARY_COLOR]: '--secondary-colour', // Matches CSS var name
	[COOKIE_KEYS.SECONDARY_TEXT_COLOR]: '--secondary-text-color',
	[COOKIE_KEYS.BORDER_COLOR]: '--custom-border-color', // Matches CSS var name
	// Add mappings for any other derived/semantic colors if they are also stored in cookies
	// and need direct application. For example:
	// 'theme_primary_fg': '--primary-foreground-color',
	// 'theme_secondary_fg': '--secondary-foreground-color',
	// 'theme_popover_bg': '--popover-background',
	// 'theme_popover_fg': '--popover-foreground-color',
	// etc.
};

export function ThemeInitializer(): React.ReactNode {
	useEffect(() => {
		// Check if a theme preference cookie exists (using PAGE_BG as the indicator)
		const hasSavedTheme = getCookie(COOKIE_KEYS.PAGE_BG);

		if (hasSavedTheme) {
			// Add pause class ONLY if applying styles from cookies
			document.documentElement.classList.add('color-transition-paused');

			// Apply saved theme colors from cookies
			Object.entries(cookieToCssVarMap).forEach(([cookieKey, cssVarName]) => {
				const value = getCookie(cookieKey);
				if (value) {
					document.documentElement.style.setProperty(cssVarName, value);
				}
			});

			// Remove pause class after styles are applied (use timeout for safety)
			// Use requestAnimationFrame to ensure the class removal happens after the styles are likely painted
			requestAnimationFrame(() => {
				// Force reflow/repaint (might not be strictly necessary but can help)
				// void document.documentElement.offsetWidth;
				setTimeout(() => {
					document.documentElement.classList.remove('color-transition-paused');
				}, 0); // Timeout 0 pushes execution to the end of the event loop
			});
		}

		// Only run once on mount
	}, []);

	// This component doesn't render anything visual
	return null;
}
