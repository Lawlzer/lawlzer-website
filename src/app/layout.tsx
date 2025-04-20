import '~/styles/globals.css'; // Assuming global styles are here

import React from 'react';
import { cookies } from 'next/headers'; // Import cookies
// import { Auth0Provider } from '@auth0/nextjs-auth0'; // Remove Auth0Provider import
// Removed import { headers } from 'next/headers';
import Topbar from '~/components/Topbar'; // Import the Topbar component
// import AuthProvider from './authProvider'; // Remove custom AuthProvider import
// import { SessionProvider } from 'next-auth/react'; // Remove SessionProvider import
// import { TRPCReactProvider } from '~/trpc/react'; // Remove TRPCReactProvider import
import { Providers } from './providers'; // Import the new Providers component

// Define COOKIE keys and default colors
// Keep these in sync with page.tsx!
const COOKIE_KEYS = {
	PAGE_BG: 'theme_page_bg',
	FG_COLOR: 'theme_fg_color',
	PRIMARY_COLOR: 'theme_primary_color',
	TOPBAR_BG: 'theme_topbar_bg',
};
const DEFAULT_COLORS = {
	PAGE_BG: '#640175',
	FG_COLOR: '#f0e0f8',
	PRIMARY_COLOR: '#bb0fd9',
	TOPBAR_BG: '#3b0047',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
	const cookieStore = await cookies(); // Explicitly await

	// Get theme colors from cookies or use defaults
	const pageBg = cookieStore.get(COOKIE_KEYS.PAGE_BG)?.value ?? DEFAULT_COLORS.PAGE_BG;
	const fgColor = cookieStore.get(COOKIE_KEYS.FG_COLOR)?.value ?? DEFAULT_COLORS.FG_COLOR;
	const primaryColor = cookieStore.get(COOKIE_KEYS.PRIMARY_COLOR)?.value ?? DEFAULT_COLORS.PRIMARY_COLOR;
	const topbarBg = cookieStore.get(COOKIE_KEYS.TOPBAR_BG)?.value ?? DEFAULT_COLORS.TOPBAR_BG;

	// Create the style object for server-side rendering
	const initialStyles = {
		'--page-background': pageBg,
		'--background': pageBg, // Keep semantic vars in sync
		'--foreground-color': fgColor,
		'--foreground': fgColor,
		'--primary-color': primaryColor,
		'--primary': primaryColor,
		'--topbar-background': topbarBg,
		'--secondary': topbarBg,
		'--muted': topbarBg,
		'--border': topbarBg,
		'--input': topbarBg,
		// Add any other variables derived from cookies here...
	} as React.CSSProperties; // Type assertion for CSS variables

	return (
		<html lang='en' style={initialStyles}>
			<head>{/* Add other head elements like meta tags, title (if not in page/layout), etc. */}</head>
			{/* Make body relative to contain the absolute main element */}
			<body className='flex min-h-screen flex-col relative' style={initialStyles}>
				{/* <AuthProvider> */}
				{/* <SessionProvider> */}
				{/* Providers are now in ./providers.tsx */}
				<Providers>
					<Topbar /> {/* Topbar takes up space at the top (approx h-16) */}
					{/* <TRPCReactProvider> */}
					{/* Make main absolute to fill space BELOW Topbar */}
					<main className='absolute inset-x-0 bottom-0 top-16 overflow-hidden'>{children}</main>
					{/* </TRPCReactProvider> */}
				</Providers>
				{/* </AuthProvider> */}
				{/* </SessionProvider> */}
			</body>
		</html>
	);
}
