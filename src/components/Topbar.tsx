'use client';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import AuthButton from './AuthButton';
import ProtectedLink from './ProtectedLink';

import { getBaseUrl, subdomains } from '~/lib/utils';
// import { getSession } from '~/server/db/session'; // Import correct session fetching function - not used in component
import type { SessionData } from '~/server/db/session'; // Import SessionData type
// import { useUser } from '@auth0/nextjs-auth0'; // Remove Auth0 hook

// Placeholder for environment variables
// In a real app, these should come from your environment configuration
// const NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL; // Removed
// const NEXT_PUBLIC_FRONTEND_PORT = env.NEXT_PUBLIC_FRONTEND_PORT; // Removed

// Mobile navigation link component
const MobileNavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) => {
	const pathname = usePathname();
	const isActive = pathname === href || (href !== getBaseUrl() && pathname.startsWith(href));

	return (
		<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 4 }}>
			<ProtectedLink
				href={href}
				onClick={onClick}
				className={`
					block px-4 py-3 rounded-lg font-medium transition-all duration-200
					${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-secondary-text hover:bg-secondary/50 hover:text-foreground'}
				`}
			>
				{children}
			</ProtectedLink>
		</motion.div>
	);
};

const Topbar = ({ session }: { session: SessionData | null }): React.JSX.Element => {
	const baseUrl = getBaseUrl();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [isValorantSubdomain, setIsValorantSubdomain] = useState(false);

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	// Check if we're on the Valorant subdomain after mount
	useEffect(() => {
		setIsValorantSubdomain(window.location.hostname.startsWith('valorant.'));
	}, []);

	// Close menu on route change
	useEffect(() => {
		setIsOpen(false);
	}, [pathname]);

	// Enhanced navigation link component
	const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
		const isActive = pathname === href || (href !== baseUrl && pathname.startsWith(href));

		return (
			<ProtectedLink
				href={href}
				className={`
					relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg
					${isActive ? 'text-primary bg-primary/10' : 'text-secondary-text hover:text-foreground hover:bg-secondary/50'}
					group
				`}
			>
				{children}
				{/* Animated dot indicator for active state */}
				{isActive && <motion.div layoutId='navbar-indicator' className='absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary' transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
			</ProtectedLink>
		);
	};

	return (
		<>
			<nav
				id='navigation'
				className={`
					fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b
					${isValorantSubdomain ? (scrolled ? 'bg-background/70 backdrop-blur-xl shadow-lg border-border' : 'bg-background/50 backdrop-blur-xl border-transparent') : scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-border' : 'bg-background/60 backdrop-blur-md border-transparent'}
				`}
			>
				<div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
					{/* Logo and Navigation grouped together */}
					<div className='flex items-center gap-8'>
						{/* Desktop Navigation - Now directly at the start */}
						<motion.div className='hidden md:flex items-center space-x-1' initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
							{/* All navigation links together */}
							<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
								<NavLink href={baseUrl}>Home</NavLink>
							</motion.div>
							{subdomains.map((subdomain, index) => (
								<motion.div key={subdomain.name} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}>
									<NavLink href={getBaseUrl(subdomain.name)}>{subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}</NavLink>
								</motion.div>
							))}
						</motion.div>
					</div>

					{/* Right side items */}
					<motion.div className='flex items-center gap-4' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
						{/* Auth Button - Always visible */}
						<AuthButton initialSession={session} />

						{/* Mobile menu button */}
						<motion.button
							onClick={() => {
								setIsOpen(!isOpen);
							}}
							className='md:hidden relative p-2.5 rounded-lg text-secondary-text hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all duration-200'
							aria-label='Toggle menu'
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<div className='relative w-6 h-6'>
								<AnimatePresence mode='wait'>
									{isOpen ? (
										<motion.div key='close' initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className='absolute inset-0'>
											<XMarkIcon className='w-6 h-6' />
										</motion.div>
									) : (
										<motion.div key='menu' initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className='absolute inset-0'>
											<Bars3Icon className='w-6 h-6' />
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</motion.button>
					</motion.div>
				</div>

				{/* Mobile Navigation Menu */}
				<AnimatePresence>
					{isOpen && (
						<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className='md:hidden overflow-hidden bg-background/95 backdrop-blur-xl' style={{ borderTop: '1px solid var(--custom-border-color)' }}>
							<div className='px-4 py-4 space-y-2'>
								{/* Home link for mobile */}
								<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
									<MobileNavLink
										href={baseUrl}
										onClick={() => {
											setIsOpen(false);
										}}
									>
										Home
									</MobileNavLink>
								</motion.div>
								{/* Subdomain links */}
								{subdomains.map((subdomain, index) => (
									<motion.div key={subdomain.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
										<MobileNavLink
											href={getBaseUrl(subdomain.name)}
											onClick={() => {
												setIsOpen(false);
											}}
										>
											{subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}
										</MobileNavLink>
									</motion.div>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</nav>

			{/* Backdrop overlay for mobile menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => {
							setIsOpen(false);
						}}
						className='fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden'
					/>
				)}
			</AnimatePresence>
		</>
	);
};

export default Topbar;
