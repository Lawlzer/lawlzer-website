import React from 'react';
import ProtectedLink from './ProtectedLink';
import AuthButton from './AuthButton'; // Import the new component
import { getBaseUrl, subdomains } from '~/lib/utils';
import { getSession } from '~/server/db/session'; // Import correct session fetching function
import type { SessionData } from '~/server/db/session'; // Import SessionData type
// import { useUser } from '@auth0/nextjs-auth0'; // Remove Auth0 hook

// Placeholder for environment variables
// In a real app, these should come from your environment configuration
// const NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL; // Removed
// const NEXT_PUBLIC_FRONTEND_PORT = env.NEXT_PUBLIC_FRONTEND_PORT; // Removed

// Make the component async to use await
export default async function Topbar(): Promise<React.JSX.Element> {
	const baseUrl = getBaseUrl(); // todo these can be generated on demand
	const sessionData: SessionData | null = await getSession(); // Fetch session data using getSession

	// Define button style with proper CSS variables from the theme system
	const buttonClass = 'px-4 py-2 border rounded-md transition-colors hover:opacity-90 bg-[var(--page-background)] text-[var(--primary-text-color)] border-[var(--custom-border-color)]';

	return (
		<nav className='bg-secondary text-secondary-foreground p-4 h-16 border-b border-border'>
			<div className='w-full flex justify-between items-start h-full'>
				<div className='flex space-x-4 flex-wrap'>
					<ProtectedLink href={baseUrl} className={buttonClass}>
						Home
					</ProtectedLink>
					{subdomains.map((subdomain) => (
						<ProtectedLink key={subdomain.name} href={getBaseUrl(subdomain.name)} className={buttonClass}>
							{subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}
						</ProtectedLink>
					))}
				</div>
				<div>
					{/* Pass session data (which can be null) as initialSession prop */}
					<AuthButton initialSession={sessionData} />
				</div>
			</div>
		</nav>
	);
}
