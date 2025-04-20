'use client';

import React from 'react';
import ProtectedLink from './ProtectedLink';
import AuthButton from './AuthButton'; // Import the new component
import { getBaseUrl } from '~/lib/utils';
import { DEFAULT_COLORS } from '~/lib/palette'; // Import back the palette
// import { useUser } from '@auth0/nextjs-auth0'; // Remove Auth0 hook

// Placeholder for environment variables
// In a real app, these should come from your environment configuration
// const NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL; // Removed
// const NEXT_PUBLIC_FRONTEND_PORT = env.NEXT_PUBLIC_FRONTEND_PORT; // Removed

export default function Topbar(): React.JSX.Element {
	const baseUrl = getBaseUrl(); // todo these can be generated on demand
	const valorantUrl = getBaseUrl('valorant');
	const colorsUrl = getBaseUrl('colors');

	// Define button style with proper CSS variables from the theme system
	const buttonClass = 'px-4 py-2 border rounded-md transition-colors hover:opacity-90 bg-[var(--page-background)] text-[var(--primary-text-color)] border-[var(--custom-border-color)]';

	return (
		<nav className='bg-secondary text-secondary-foreground p-4 h-16 border-b border-border'>
			<div className='container mx-auto flex justify-between items-center h-full'>
				<div className='flex space-x-4'>
					<ProtectedLink href={baseUrl} className={buttonClass}>
						Home
					</ProtectedLink>
					<ProtectedLink href={valorantUrl} className={buttonClass}>
						Valorant
					</ProtectedLink>
					<ProtectedLink href={colorsUrl} className={buttonClass}>
						Colors
					</ProtectedLink>
				</div>
				<div>
					<AuthButton />
				</div>
			</div>
		</nav>
	);
}
