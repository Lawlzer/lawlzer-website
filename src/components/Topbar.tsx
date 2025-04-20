'use client';

import Link from 'next/link';
import React from 'react';
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
					<Link href={baseUrl} className='hover:text-primary'>
						Home
					</Link>
					<Link href={valorantUrl} className='hover:text-primary'>
						Valorant
					</Link>
					<Link href={colorsUrl} className='hover:text-primary'>
						Colors
					</Link>
					<Link href='https://example.com' target='_blank' rel='noopener noreferrer' className='hover:text-primary'>
						Example
					</Link>
				</div>
				<div>
					<AuthButton />
				</div>
			</div>
		</nav>
	);
}
