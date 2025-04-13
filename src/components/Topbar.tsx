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

	return (
		<nav className='bg-gray-800 text-white p-4 h-16'>
			<div className='container mx-auto flex justify-between items-center h-full'>
				<div className='flex space-x-4'>
					<Link href={baseUrl} className='hover:text-gray-300'>
						Home
					</Link>
					<Link href={valorantUrl} className='hover:text-gray-300'>
						Valorant
					</Link>
					<Link href='https://example.com' target='_blank' rel='noopener noreferrer' className='hover:text-gray-300'>
						Example
					</Link>
				</div>
				<div>
					{/* Replace the placeholder with the AuthButton component */}
					<AuthButton />
					{/* Original conditional rendering logic:
					{isLoading ? (
						<div>Loading...</div>
					) : error ? (
						(() => {
							console.error(error);
							return <div>Error fetching user</div>; // Simplified error message
						})()
					) : user ? (
						<div className='flex items-center space-x-4'>
							<span>User Name</span>
							<a href='/logout' className='hover:text-gray-300'> 
								Logout
							</a>
						</div>
					) : (
						<a href='/login' className='hover:text-gray-300'> 
							Login
						</a>
					)}
					*/}
				</div>
			</div>
		</nav>
	);
}
