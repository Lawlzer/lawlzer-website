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

// Define COOKIE keys to check server-side - these must match the client-side values in palette.ts
const COOKIE_KEYS = {
	PAGE_BG: 'theme_page_bg',
	PRIMARY_TEXT_COLOR: 'theme_primary_text_color',
	PRIMARY_COLOR: 'theme_primary_color',
	SECONDARY_COLOR: 'theme_secondary_color',
	SECONDARY_TEXT_COLOR: 'theme_secondary_text_color',
	BORDER_COLOR: 'theme_border_color',
};

// Hard-code default values in case cookies don't exist (must match the values in palette.ts)
const DEFAULT_COLORS = {
	PAGE_BG: '#640175',
	PRIMARY_TEXT_COLOR: '#f0e0f8',
	PRIMARY_COLOR: '#bb0fd9',
	SECONDARY_COLOR: '#3b0047',
	SECONDARY_TEXT_COLOR: '#c0a0c8',
	BORDER_COLOR: '#450052',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
	const cookieStore = await cookies(); // Explicitly await

	// Get cookie values securely server-side
	const pageBg = cookieStore.get(COOKIE_KEYS.PAGE_BG)?.value ?? DEFAULT_COLORS.PAGE_BG;
	const primaryTextColor = cookieStore.get(COOKIE_KEYS.PRIMARY_TEXT_COLOR)?.value ?? DEFAULT_COLORS.PRIMARY_TEXT_COLOR;
	const primaryColor = cookieStore.get(COOKIE_KEYS.PRIMARY_COLOR)?.value ?? DEFAULT_COLORS.PRIMARY_COLOR;
	const secondaryColor = cookieStore.get(COOKIE_KEYS.SECONDARY_COLOR)?.value ?? DEFAULT_COLORS.SECONDARY_COLOR;
	const secondaryTextColor = cookieStore.get(COOKIE_KEYS.SECONDARY_TEXT_COLOR)?.value ?? DEFAULT_COLORS.SECONDARY_TEXT_COLOR;
	const borderColor = cookieStore.get(COOKIE_KEYS.BORDER_COLOR)?.value ?? DEFAULT_COLORS.BORDER_COLOR;

	// Create the style object for server-side rendering
	const globalStyles = {
		'--page-background': pageBg,
		'--background': pageBg,
		'--primary-text-color': primaryTextColor,
		'--foreground': primaryTextColor,
		'--primary-color': primaryColor,
		'--primary': primaryColor,
		'--secondary-colour': secondaryColor,
		'--secondary': secondaryColor,
		'--muted': secondaryColor,
		'--border': borderColor,
		'--input': secondaryColor,
		'--secondary-text-color': secondaryTextColor,
		'--secondary-text': secondaryTextColor,
		// Add any other variables derived from cookies here...
	} as React.CSSProperties; // Type assertion for CSS variables

	return (
		<html lang='en' style={globalStyles}>
			<head>{/* Add other head elements like meta tags, title (if not in page/layout), etc. */}</head>
			{/* Make body relative to contain the absolute main element */}
			<body className='flex min-h-screen flex-col relative' style={globalStyles}>
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
