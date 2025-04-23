import '~/styles/globals.css'; // Assuming global styles are here

import React from 'react';
// import dynamic from 'next/dynamic'; // Remove dynamic import
// import { cookies } from 'next/headers'; // REMOVED: No longer reading cookies server-side for styles
// import { Auth0Provider } from '@auth0/nextjs-auth0'; // Remove Auth0Provider import
// Removed import { headers } from 'next/headers';
import Topbar from '~/components/Topbar'; // Import the Topbar component
// import AuthProvider from './authProvider'; // Remove custom AuthProvider import
// import { SessionProvider } from 'next-auth/react'; // Remove SessionProvider import
// import { TRPCReactProvider } from '~/trpc/react'; // Remove TRPCReactProvider import
import { Providers } from './providers'; // Import the new Providers component
// import { ClientThemeInitializer } from '~/components/theme/ClientThemeInitializer'; // Import the new client wrapper - COMMENTED OUT
// import Script from 'next/script'; // REMOVE next/script import

// REMOVED: Dynamic import logic moved to ClientThemeInitializer
// const ThemeInitializer = dynamic(async () => import('~/components/theme/ThemeInitializer').then((mod) => mod.ThemeInitializer), {
// 	ssr: false,
// });

// REMOVED: Server-side cookie/default definitions
// const COOKIE_KEYS = { ... };
// const DEFAULT_COLORS = { ... };

// Function to generate the theme initialization script string
function getThemeInitializationScript(): string {
	// Restore Minimal cookie getter function
	// IMPORTANT: This is duplicated from palette.ts to avoid imports in this critical path script.
	// Any changes here should likely be reflected in palette.ts too.
	function getCookie_inline(name: string): string | null {
		if (typeof document === 'undefined') return null;
		const nameEQ = name + '=';
		const ca = document.cookie.split(';');
		for (let c of ca) {
			c = c.trimStart();
			if (c.startsWith(nameEQ)) {
				return c.substring(nameEQ.length);
			}
		}
		return null;
	}

	return `
(function() {
  // Use COOKIE_KEYS again
  const COOKIE_KEYS = {
    PAGE_BG: 'theme_page_bg',
    PRIMARY_TEXT_COLOR: 'theme_primary_text_color',
    PRIMARY_COLOR: 'theme_primary_color',
    SECONDARY_COLOR: 'theme_secondary_color',
    SECONDARY_TEXT_COLOR: 'theme_secondary_text_color',
    BORDER_COLOR: 'theme_border_color',
  };
  // Match light mode defaults from globals.css :root
  const DEFAULT_COLORS = {
    PAGE_BG: '#ffffff',
    PRIMARY_TEXT_COLOR: '#111827',
    PRIMARY_COLOR: '#3c33e6',
    SECONDARY_COLOR: '#f2f2f2',
    SECONDARY_TEXT_COLOR: '#6b7280',
    BORDER_COLOR: '#e5e7eb',
  };
  // Map internal keys to actual CSS variable names used in globals.css
  const CSS_VAR_MAP = {
    PAGE_BG: '--page-background',
    PRIMARY_TEXT_COLOR: '--primary-text-color',
    PRIMARY_COLOR: '--primary-color',
    SECONDARY_COLOR: '--secondary-colour',
    SECONDARY_TEXT_COLOR: '--secondary-text-color',
    BORDER_COLOR: '--custom-border-color',
  };

  // Minimal cookie getter (copied from palette.ts)
  function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  const root = document.documentElement;
  // Apply colors from Cookies or defaults
  try {
    for (const key in COOKIE_KEYS) {
      const cookieName = COOKIE_KEYS[key]; // Use COOKIE_KEYS
      const cssVarName = CSS_VAR_MAP[key];
      const defaultValue = DEFAULT_COLORS[key];
      const cookieValue = getCookie(cookieName); // Use getCookie defined inside IIFE

      const color = cookieValue ?? defaultValue;
      if (cssVarName) { // Ensure the map entry exists
        root.style.setProperty(cssVarName, color);
      }
    }
  } catch (e) {
    console.error("Error applying theme from cookies", e);
    // Apply defaults in case of error
    for (const key in COOKIE_KEYS) {
      const cssVarName = CSS_VAR_MAP[key];
      const defaultValue = DEFAULT_COLORS[key];
      if (cssVarName) {
        root.style.setProperty(cssVarName, defaultValue);
      }
    }
  }
})();
  `;
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	// REMOVED: Server-side cookie reading and style object creation
	// const cookieStore = cookies();
	// const pageBg = ...;
	// const primaryTextColor = ...;
	// ...etc...
	// const globalStyles = { ... };

	// REMOVED: Inline script string definition
	// const themeScript = `...`;

	// Return statement simplified: No inline styles needed on html/body from server
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				{/* Add other head elements like meta tags, title (if not in page/layout), etc. */}
				<script dangerouslySetInnerHTML={{ __html: getThemeInitializationScript() }} />
				{/* <Script id="theme-init" strategy="beforeInteractive">
					{getThemeInitializationScript()}
				</Script> // REMOVED */}
			</head>
			<body className='flex min-h-screen flex-col relative'>
				{/* <ClientThemeInitializer /> // COMMENTED OUT: Initial theme now set by inline script */}
				<Providers>
					<Topbar />
					<main className='absolute inset-x-0 bottom-0 top-16'>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
