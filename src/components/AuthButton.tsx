'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ArrowRightOnRectangleIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

import { cn, getBaseUrl } from '~/lib/utils';
import type { SessionData } from '~/server/db/session';

interface AuthButtonProps {
	initialSession: SessionData | null;
}

const AuthButton = ({ initialSession }: AuthButtonProps): React.JSX.Element => {
	const [user, setUser] = useState(initialSession?.user ?? null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setUser(initialSession?.user ?? null);
	}, [initialSession]);

	// If loading, show skeleton
	if (loading) {
		return <div className='h-10 w-32 shimmer rounded-xl bg-secondary/50 backdrop-blur-sm' data-testid='auth-loading' />;
	}

	if (user) {
		return (
			<Menu as='div' className='relative'>
				<MenuButton className='group inline-flex items-center gap-2 rounded-xl bg-secondary/50 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50'>
					<UserCircleIcon className='h-5 w-5 text-secondary-text transition-colors group-hover:text-primary' />
					<span className='hidden sm:inline-block'>{user.name ?? user.email ?? 'Account'}</span>
					<ChevronDownIcon aria-hidden='true' className='h-4 w-4 text-secondary-text transition-transform duration-200 group-hover:text-primary group-data-[open]:rotate-180' />
				</MenuButton>

				<AnimatePresence>
					<MenuItems as={motion.div} initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className='absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-popover/95 backdrop-blur-lg shadow-xl ring-1 ring-border/50 focus:outline-none' data-testid='menuitems'>
						<div className='p-1.5'>
							<MenuItem>
								{({ active }) => (
									<a
										className={cn('group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200', active ? 'bg-destructive/10 text-destructive' : 'text-foreground hover:bg-secondary/50')}
										href={`${getBaseUrl()}/api/auth/logout`}
										onClick={() => {
											setLoading(true);
										}}
									>
										<ArrowRightOnRectangleIcon className='h-5 w-5' />
										Sign out
									</a>
								)}
							</MenuItem>
						</div>
					</MenuItems>
				</AnimatePresence>
			</Menu>
		);
	}

	// User is not logged in
	return (
		<Menu as='div' className='relative'>
			<MenuButton className='group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 glow'>
				<span>Sign In</span>
				<ChevronDownIcon aria-hidden='true' className='h-4 w-4 transition-transform duration-200 group-data-[open]:rotate-180' />
			</MenuButton>

			<AnimatePresence>
				<MenuItems as={motion.div} initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className='absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-popover/95 backdrop-blur-lg shadow-xl ring-1 ring-border/50 focus:outline-none' data-testid='menuitems'>
					<div className='p-2'>
						<div className='mb-3 px-3 pt-2'>
							<h3 className='text-sm font-semibold text-foreground'>Welcome back!</h3>
							<p className='text-xs text-secondary-text mt-1'>Sign in to your account</p>
						</div>

						<div className='space-y-1'>
							{[
								{
									provider: 'google',
									label: 'Continue with Google',
									icon: (
										<svg className='h-5 w-5' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
											<g transform='matrix(1, 0, 0, 1, 27.009001, -39.238998)'>
												<path d='M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z' fill='#4285F4' />
												<path d='M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z' fill='#34A853' />
												<path d='M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z' fill='#FBBC05' />
												<path d='M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z' fill='#EA4335' />
											</g>
										</svg>
									),
									bgColor: 'hover:bg-primary/10',
									disabled: false,
								},
								{
									provider: 'github',
									label: 'Continue with GitHub',
									icon: (
										<svg className='h-5 w-5' viewBox='0 0 127.14 96.36' xmlns='http://www.w3.org/2000/svg'>
											<path clipRule='evenodd' d='M63.996 0C40.054 0 19.32 16.73 14.565 39.335C10.24 59.668 20.88 79.41 39.09 88.41a4.68 4.68 0 0 0 1.59.286c0-.698-.03-4.825-.03-8.098c-13.424 2.488-16.445-2.802-17.48-5.374c-.587-1.496-3.115-5.375-5.327-6.46c-1.82-.983-4.423-3.407-.07-3.466c4.102-.058 7.028 3.777 8.004 5.345c4.68 7.867 12.18 5.658 15.156 4.292c.469-3.377 1.81-5.658 3.3-6.96c-11.553-1.302-23.642-5.775-23.642-25.645c0-5.66 2.023-10.306 5.346-13.944c-.528-1.302-2.32-6.602.515-13.74c0 0 1.114-.285 3.094-.285c2.91 0 6.717 1.086 10.788 4.695a46.543 46.543 0 0 1 12.363-1.658c4.194 0 8.387.565 12.362 1.658c4.07-3.61 7.878-4.695 10.788-4.695c1.98 0 3.094.285 3.094.285c2.834 7.138 1.043 12.438.515 13.74c3.323 3.638 5.346 8.274 5.346 13.944c0 19.93-12.128 24.343-23.7 25.645c1.86 1.604 3.514 4.76 3.514 9.603c0 6.96-.06 12.554-.06 14.275c0 .385.082.748.234 1.086c12.89 11.368 29.905 9.07 41.273-5.584s9.07-33.67-5.584-45.038A47.893 47.893 0 0 0 63.996 0Z' fill='currentColor' fillRule='evenodd' />
										</svg>
									),
									bgColor: 'hover:bg-secondary',
									disabled: false,
								},
								{
									provider: 'discord',
									label: 'Continue with Discord',
									icon: (
										<svg className='h-5 w-5' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
											<path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418Z' fill='#7289DA' />
										</svg>
									),
									bgColor: 'hover:bg-accent/10',
									disabled: true,
								},
							].map(({ provider, label, icon, disabled, bgColor }) => (
								<MenuItem key={provider}>
									{({ active }) => (
										<motion.a
											whileHover={{ x: disabled ? 0 : 4 }}
											whileTap={{ scale: disabled ? 1 : 0.98 }}
											className={cn('group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200', active && !disabled ? bgColor : 'hover:bg-secondary/50', disabled && 'cursor-not-allowed opacity-50')}
											href={`${getBaseUrl()}/api/auth/login?provider=${provider}`}
											onClick={
												disabled
													? (e) => {
															e.preventDefault();
														}
													: () => {
															setLoading(true);
														}
											}
										>
											<span className='flex-shrink-0'>{icon}</span>
											<span className='flex-1'>{label}</span>
											{disabled && <span className='absolute right-3 top-1 text-[10px] font-semibold text-secondary-text'>SOON</span>}
											{!disabled && <ChevronDownIcon className='h-4 w-4 rotate-[-90deg] opacity-0 transition-all duration-200 group-hover:opacity-100' />}
										</motion.a>
									)}
								</MenuItem>
							))}
						</div>
					</div>
				</MenuItems>
			</AnimatePresence>
		</Menu>
	);
};

export default AuthButton;
