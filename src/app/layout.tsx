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
import { ClientThemeInitializer } from '~/components/theme/ClientThemeInitializer'; // Import the new client wrapper

// REMOVED: Dynamic import logic moved to ClientThemeInitializer
// const ThemeInitializer = dynamic(async () => import('~/components/theme/ThemeInitializer').then((mod) => mod.ThemeInitializer), {
// 	ssr: false,
// });

// REMOVED: Server-side cookie/default definitions
// const COOKIE_KEYS = { ... };
// const DEFAULT_COLORS = { ... };

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	// REMOVED: Server-side cookie reading and style object creation
	// const cookieStore = cookies();
	// const pageBg = ...;
	// const primaryTextColor = ...;
	// ...etc...
	// const globalStyles = { ... };

	// Return statement simplified: No inline styles needed on html/body from server
	return (
		<html lang='en'>
			<head>{/* Add other head elements like meta tags, title (if not in page/layout), etc. */}</head>
			<body className='flex min-h-screen flex-col relative'>
				<ClientThemeInitializer />
				<Providers>
					<Topbar />
					<main className='absolute inset-x-0 bottom-0 top-16'>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
