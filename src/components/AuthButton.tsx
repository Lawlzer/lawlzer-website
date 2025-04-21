'use client';

import React, { useState } from 'react';
import { Menu, MenuButton, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import type { SessionData } from '~/server/db/session'; // Assuming SessionData is exported

// Define props type to include initialSession
interface AuthButtonProps {
	initialSession: SessionData | null;
}

export default function AuthButton({ initialSession }: AuthButtonProps): React.JSX.Element {
	// Initialize state with the prop
	const [session, setSession] = useState<SessionData | null>(initialSession);
	// No longer loading initially as data is provided
	const [loading, setLoading] = useState(false);
	const isDevelopment = process.env.NODE_ENV === 'development'; // Check NODE_ENV

	const user = session?.user;

	if (loading) {
		return <div data-testid='auth-loading' className='animate-pulse bg-muted rounded w-20 h-10'></div>;
	}

	if (user) {
		return (
			<Menu as='div' className='relative inline-block text-left'>
				<div>
					<MenuButton className='inline-flex w-full justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'>
						{user.name ?? user.email ?? 'Account'}
						<ChevronDownIcon className='-mr-1 ml-2 h-5 w-5 text-muted-foreground' aria-hidden='true' />
					</MenuButton>
				</div>
				<Transition as={Fragment} enter='transition ease-out duration-100' enterFrom='transform opacity-0 scale-95' enterTo='transform opacity-100 scale-100' leave='transition ease-in duration-75' leaveFrom='transform opacity-100 scale-100' leaveTo='transform opacity-0 scale-95'>
					<Menu.Items data-testid='menuitems' className='absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-border focus:outline-none z-50'>
						<div className='px-1 py-1'>
							<Menu.Item>
								{({ active }) => (
									<button
										role='menuitem'
										onClick={() => {
											// Use custom logout endpoint
											window.location.href = '/api/auth/logout';
										}}
										className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
									>
										Logout
									</button>
								)}
							</Menu.Item>
						</div>
					</Menu.Items>
				</Transition>
			</Menu>
		);
	}

	// Not authenticated
	return (
		<Menu as='div' className='relative inline-block text-left'>
			<div>
				<MenuButton className='inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'>
					Login / Register
					<ChevronDownIcon className='-mr-1 ml-2 h-5 w-5 text-primary-foreground/80' aria-hidden='true' />
				</MenuButton>
			</div>
			<Transition as={Fragment} enter='transition ease-out duration-100' enterFrom='transform opacity-0 scale-95' enterTo='transform opacity-100 scale-100' leave='transition ease-in duration-75' leaveFrom='transform opacity-100 scale-100' leaveTo='transform opacity-0 scale-95'>
				<Menu.Items data-testid='menuitems' className='absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-border focus:outline-none z-50'>
					<div className='px-1 py-1'>
						<Menu.Item disabled={isDevelopment}>
							{({ active, disabled }) => (
								<button
									role='menuitem'
									onClick={() => {
										if (!disabled) {
											window.location.href = '/api/auth/login?provider=google';
										}
									}}
									disabled={disabled}
									title={disabled ? "NODE_ENV === 'development', and Google OAuth does not work on localhost" : undefined}
									className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
								>
									<svg className='w-5 h-5 mr-2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
										<path fill='#EA4335' d='M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z' />
										<path fill='#34A853' d='M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z' />
										<path fill='#4A90E2' d='M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z' />
										<path fill='#FBBC05' d='M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z' />
									</svg>
									Sign in with Google
								</button>
							)}
						</Menu.Item>
						<Menu.Item>
							{({ active }) => (
								<button
									role='menuitem'
									onClick={() => {
										window.location.href = '/api/auth/login?provider=discord';
									}}
									className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
								>
									<svg className='w-5 h-5 mr-2' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 127.14 96.36'>
										<path fill='#5865F2' d='M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z' />
									</svg>
									Sign in with Discord
								</button>
							)}
						</Menu.Item>
						<Menu.Item>
							{({ active }) => (
								<button
									role='menuitem'
									onClick={() => {
										window.location.href = '/api/auth/login?provider=github';
									}}
									className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
								>
									<svg className='w-5 h-5 mr-2' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
										<path fill='currentColor' d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
									</svg>
									Sign in with GitHub
								</button>
							)}
						</Menu.Item>
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
