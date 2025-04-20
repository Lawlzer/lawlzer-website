'use client';

import React from 'react';
import ProtectedLink from './ProtectedLink';
import AuthButton from './AuthButton'; // Import the new component
import { getBaseUrl } from '~/lib/utils';
// import { useUser } from '@auth0/nextjs-auth0'; // Remove Auth0 hook

// Placeholder for environment variables
// In a real app, these should come from your environment configuration
// const NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL; // Removed
// const NEXT_PUBLIC_FRONTEND_PORT = env.NEXT_PUBLIC_FRONTEND_PORT; // Removed

export default function Topbar(): React.JSX.Element {
	const baseUrl = getBaseUrl(); // todo these can be generated on demand
	const valorantUrl = getBaseUrl('valorant');
	const colorsUrl = getBaseUrl('colors');

	return (
		<nav className='bg-secondary text-secondary-foreground p-4 h-16 border-b border-border'>
			<div className='container mx-auto flex justify-between items-center h-full'>
				<div className='flex space-x-4'>
					<ProtectedLink href={baseUrl} className='hover:text-primary'>
						Home
					</ProtectedLink>
					<ProtectedLink href={valorantUrl} className='hover:text-primary'>
						Valorant
					</ProtectedLink>
					<ProtectedLink href={colorsUrl} className='hover:text-primary'>
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
