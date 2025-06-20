import type { Metadata } from 'next';
import React from 'react';

// import AuthProvider from './authProvider'; // Remove custom AuthProvider import
// import { SessionProvider } from 'next-auth/react'; // Remove SessionProvider import
// import { TRPCReactProvider } from '~/trpc/react'; // Remove TRPCReactProvider import
import { Providers } from './providers'; // Import the new Providers component

import '~/styles/globals.css'; // Assuming global styles are here

// import dynamic from 'next/dynamic'; // Remove dynamic import
// import { cookies } from 'next/headers'; // REMOVED: No longer reading cookies server-side for styles
// import { Auth0Provider } from '@auth0/nextjs-auth0'; // Remove Auth0Provider import
// Removed import { headers } from 'next/headers';
import Topbar from '~/components/Topbar'; // Import the Topbar component
import { getBaseUrl } from '~/lib/utils'; // Import getBaseUrl for dynamic URLs
import { getSession } from '~/server/db/session'; // Import getSession function
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
	// IMPORTANT: The functions and constants here are duplicated from palette.ts
	// to avoid imports in this critical path script. They must be kept minimal
	// and in sync with palette.ts logic if necessary.

	return `
(function() {
  // Minimal subset of COOKIE_KEYS from palette.ts
  const COOKIE_KEYS = {
    PAGE_BG: 'theme_page_bg',
    PRIMARY_TEXT_COLOR: 'theme_primary_text_color',
    PRIMARY_COLOR: 'theme_primary_color',
    SECONDARY_COLOR: 'theme_secondary_color',
    SECONDARY_TEXT_COLOR: 'theme_secondary_text_color',
    BORDER_COLOR: 'theme_border_color',
  };

  // Minimal subset of PREDEFINED_PALETTES (Light/Dark) from palette.ts
  const LIGHT_MODE_COLORS = {
    PAGE_BG: '#ffffff',
    PRIMARY_TEXT_COLOR: '#111827',
    PRIMARY_COLOR: '#3c33e6',
    SECONDARY_COLOR: '#f2f2f2',
    SECONDARY_TEXT_COLOR: '#6b7280',
    BORDER_COLOR: '#e5e7eb',
  };
  const DARK_MODE_COLORS = {
    PAGE_BG: '#1f2937',
    PRIMARY_TEXT_COLOR: '#f9fafb',
    PRIMARY_COLOR: '#818cf8',
    SECONDARY_COLOR: '#374151',
    SECONDARY_TEXT_COLOR: '#9ca3af',
    BORDER_COLOR: '#4b5563',
  };

  // Map internal keys to actual CSS variable names used in globals.css
  const CSS_VAR_MAP = {
    PAGE_BG: '--page-background', // Matches globals.css
    PRIMARY_TEXT_COLOR: '--primary-text-color',
    PRIMARY_COLOR: '--primary-color',
    SECONDARY_COLOR: '--secondary-colour', // Ensure this matches globals.css
    SECONDARY_TEXT_COLOR: '--secondary-text-color',
    BORDER_COLOR: '--custom-border-color', // Ensure this matches globals.css
  };

  // Minimal cookie getter (copied from palette.ts)
  function getCookie(name) {
    // Simplified version for inline script
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Determine default colors based on system preference
  let defaultColors = LIGHT_MODE_COLORS;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      defaultColors = DARK_MODE_COLORS;
    }
  } catch (e) {
    // Fallback to light mode if matchMedia fails
    console.warn("Could not detect system color scheme preference.", e);
  }

  const root = document.documentElement;
  // Apply colors from Cookies or the determined defaults
  try {
    for (const key in COOKIE_KEYS) {
      const cookieName = COOKIE_KEYS[key];
      const cssVarName = CSS_VAR_MAP[key];
      const defaultValue = defaultColors[key]; // Use determined default
      const cookieValue = getCookie(cookieName);

      const color = cookieValue ?? defaultValue;
      if (cssVarName && color) { // Ensure the map entry and color value exist
        root.style.setProperty(cssVarName, color);
      }
    }
    // Apply derived CSS variables needed by shadcn/ui based on the primary ones
    root.style.setProperty('--background', root.style.getPropertyValue('--page-background'));
    root.style.setProperty('--foreground', root.style.getPropertyValue('--primary-text-color'));
    root.style.setProperty('--primary', root.style.getPropertyValue('--primary-color'));
    root.style.setProperty('--primary-foreground', root.style.getPropertyValue('--primary-text-color')); // Usually same as foreground
    root.style.setProperty('--secondary', root.style.getPropertyValue('--secondary-colour'));
    root.style.setProperty('--secondary-foreground', root.style.getPropertyValue('--secondary-text-color'));
    root.style.setProperty('--muted', root.style.getPropertyValue('--secondary-colour'));
    root.style.setProperty('--muted-foreground', root.style.getPropertyValue('--secondary-text-color'));
    root.style.setProperty('--accent', root.style.getPropertyValue('--secondary-colour')); // Often mapped to secondary
    root.style.setProperty('--accent-foreground', root.style.getPropertyValue('--secondary-text-color'));
    root.style.setProperty('--destructive', '#ef4444'); // Example destructive color
    root.style.setProperty('--destructive-foreground', '#ffffff');
    root.style.setProperty('--border', root.style.getPropertyValue('--custom-border-color'));
    root.style.setProperty('--input', root.style.getPropertyValue('--secondary-colour')); // Input often uses secondary
    root.style.setProperty('--ring', root.style.getPropertyValue('--primary-color')); // Ring often uses primary

  } catch (e) {
    console.error("Error applying theme from cookies/defaults", e);
    // Minimal fallback: Apply hardcoded light mode defaults in case of any error
    try {
      for (const key in CSS_VAR_MAP) {
        const cssVarName = CSS_VAR_MAP[key];
        const fallbackValue = LIGHT_MODE_COLORS[key];
        if (cssVarName && fallbackValue) {
          root.style.setProperty(cssVarName, fallbackValue);
        }
      }
      // Apply derived variables with fallback values too
      root.style.setProperty('--background', LIGHT_MODE_COLORS.PAGE_BG);
      root.style.setProperty('--foreground', LIGHT_MODE_COLORS.PRIMARY_TEXT_COLOR);
      // ... (add fallbacks for other derived vars if necessary)
    } catch (fallbackError) {
      console.error("Error applying fallback theme", fallbackError);
    }
  }
})();
  `;
}

// SEO Metadata
const baseUrl = getBaseUrl();
export const metadata: Metadata = {
	title: 'Kevin Porter - Full Stack Developer',
	description: 'Full-stack developer passionate about creating elegant solutions to complex problems. Specializing in TypeScript, React, and modern web technologies.',
	keywords: ['Kevin Porter', 'Full Stack Developer', 'TypeScript', 'React', 'Next.js', 'Web Development'],
	authors: [{ name: 'Kevin Porter' }],
	creator: 'Kevin Porter',
	publisher: 'Kevin Porter',
	metadataBase: new URL(baseUrl),
	openGraph: {
		title: 'Kevin Porter - Full Stack Developer',
		description: 'Full-stack developer passionate about creating elegant solutions to complex problems. Specializing in TypeScript, React, and modern web technologies.',
		url: baseUrl,
		siteName: 'Kevin Porter Portfolio',
		type: 'website',
		locale: 'en_US',
		images: [
			{
				url: '/og-image.png', // You'll need to add this image
				width: 1200,
				height: 630,
				alt: 'Kevin Porter - Full Stack Developer',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Kevin Porter - Full Stack Developer',
		description: 'Full-stack developer passionate about creating elegant solutions to complex problems.',
		images: ['/og-image.png'],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	icons: {
		icon: '/favicon.ico',
		shortcut: '/favicon-16x16.png',
		apple: '/apple-touch-icon.png',
	},
	manifest: '/manifest.json',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
	// REMOVED: Server-side cookie reading and style object creation
	// const cookieStore = cookies();
	// const pageBg = ...;
	// const primaryTextColor = ...;
	// ...etc...
	// const globalStyles = { ... };

	// REMOVED: Inline script string definition
	// const themeScript = `...`;

	// Fetch session for the Topbar
	const session = await getSession();

	// Return statement simplified: No inline styles needed on html/body from server
	return (
		<html suppressHydrationWarning lang='en'>
			<head>
				{/* Add other head elements like meta tags, title (if not in page/layout), etc. */}
				{}
				<script dangerouslySetInnerHTML={{ __html: getThemeInitializationScript() }} />
				{/* Resource Hints for Performance */}
				<link rel='dns-prefetch' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
				{/* Structured Data for SEO */}
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'Person',
							name: 'Kevin Porter',
							url: baseUrl,
							sameAs: ['https://github.com/lawlzer', 'https://linkedin.com/in/lawlzer'],
							jobTitle: 'Full Stack Developer',
							description: 'Full-stack developer passionate about creating elegant solutions to complex problems. Specializing in TypeScript, React, and modern web technologies.',
							knowsAbout: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Web Development', 'Full Stack Development'],
							alumniOf: {
								'@type': 'Organization',
								name: 'Self-taught',
							},
						}),
					}}
				/>
			</head>
			<body className='relative flex min-h-screen flex-col'>
				{/* Skip Links for Accessibility */}
				<a href='#main-content' className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none'>
					Skip to main content
				</a>
				<a href='#navigation' className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none'>
					Skip to navigation
				</a>
				{/* <ClientThemeInitializer /> // COMMENTED OUT: Initial theme now set by inline script */}
				<Providers>
					<Topbar session={session} />
					<main id='main-content' className='flex-1 pt-16'>
						{children}
					</main>
				</Providers>
			</body>
		</html>
	);
}
