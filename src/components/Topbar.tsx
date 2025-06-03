import React from 'react';

import AuthButton from './AuthButton'; // Import the new component
import ProtectedLink from './ProtectedLink';

import { getBaseUrl, subdomains } from '~/lib/utils';
// import { getSession } from '~/server/db/session'; // Import correct session fetching function - not used in component
import type { SessionData } from '~/server/db/session'; // Import SessionData type
// import { useUser } from '@auth0/nextjs-auth0'; // Remove Auth0 hook

// Placeholder for environment variables
// In a real app, these should come from your environment configuration
// const NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL; // Removed
// const NEXT_PUBLIC_FRONTEND_PORT = env.NEXT_PUBLIC_FRONTEND_PORT; // Removed

const Topbar = ({ session }: { session: SessionData | null }): React.JSX.Element => {
	const baseUrl = getBaseUrl(); // todo these can be generated on demand

	// Define button style with proper CSS variables from the theme system
	const buttonClass = 'px-4 py-2 border rounded-md transition-colors hover:opacity-90 bg-[var(--page-background)] text-[var(--primary-text-color)] border-[var(--custom-border-color)]';

	return (
		<nav className='bg-secondary text-secondary-foreground border-border h-16 border-b p-4'>
			<div className='flex h-full w-full items-start justify-between'>
				<div className='flex flex-wrap space-x-4'>
					<ProtectedLink className={buttonClass} href={baseUrl}>
						Home
					</ProtectedLink>
					{subdomains.map((subdomain) => (
						<ProtectedLink key={subdomain.name} className={buttonClass} href={getBaseUrl(subdomain.name)}>
							{subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}
						</ProtectedLink>
					))}
				</div>
				<div>
					{/* Pass session data (which can be null) as initialSession prop */}
					<AuthButton initialSession={session} />
				</div>
			</div>
		</nav>
	);
};

export default Topbar;
