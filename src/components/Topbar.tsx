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

	// Define modern navigation link styles
	const linkClass = 'relative px-4 py-2 text-sm font-medium text-secondary-text transition-all hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full';

	return (
		<nav className='fixed top-0 left-0 right-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border'>
			<div className='mx-auto flex h-full max-w-7xl items-center justify-between px-6'>
				{/* Navigation Links */}
				<div className='flex items-center space-x-1'>
					<ProtectedLink className={linkClass} href={baseUrl}>
						Home
					</ProtectedLink>
					{subdomains.map((subdomain) => (
						<ProtectedLink key={subdomain.name} className={linkClass} href={getBaseUrl(subdomain.name)}>
							{subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}
						</ProtectedLink>
					))}
				</div>

				{/* Auth Button */}
				<div className='flex items-center'>
					<AuthButton initialSession={session} />
				</div>
			</div>
		</nav>
	);
};

export default Topbar;
