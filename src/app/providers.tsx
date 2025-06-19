'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { ToastProvider } from '~/components/Toast';
import { TRPCReactProvider } from '~/trpc/react';

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<TRPCReactProvider>
			<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
				<ToastProvider>{children}</ToastProvider>
			</ThemeProvider>
		</TRPCReactProvider>
	);
}
