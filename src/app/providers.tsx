'use client';

import React from 'react';
// Remove unused SessionProvider import
// import { SessionProvider } from 'next-auth/react';
import { TRPCReactProvider } from '~/trpc/react';

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
	return (
		// Remove SessionProvider wrapper
		// <SessionProvider>
		<TRPCReactProvider>{children}</TRPCReactProvider>
		// </SessionProvider>
	);
}
