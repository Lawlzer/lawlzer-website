import '~/styles/globals.css'; // Assuming global styles are here

import React from 'react';
// import { Auth0Provider } from '@auth0/nextjs-auth0'; // Remove Auth0Provider import
// Removed import { headers } from 'next/headers';
import Topbar from '~/components/Topbar'; // Import the Topbar component
// import AuthProvider from './authProvider'; // Remove custom AuthProvider import
// import { SessionProvider } from 'next-auth/react'; // Remove SessionProvider import
// import { TRPCReactProvider } from '~/trpc/react'; // Remove TRPCReactProvider import
import { Providers } from './providers'; // Import the new Providers component

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	// Removed header fetching/conversion logic
	return (
		<html lang='en'>
			{/* Make body relative to contain the absolute main element */}
			<body className='flex min-h-screen flex-col relative bg-blue-500'>
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
