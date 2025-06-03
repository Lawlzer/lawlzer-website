'use client';

import { AnimatePresence, motion } from 'framer-motion'; // Import motion and AnimatePresence
import Image from 'next/image'; // Import Image for placeholders
import type { JSX } from 'react';
import React, { useState } from 'react';

import DataPlatformPreview from './components/DataPlatformPreview'; // Import the new component

import { getBaseUrl } from '~/lib/utils'; // Import getBaseUrl

export default function MainPage(): JSX.Element {
	// State for controlling the overlay and selected card ID
	const [selectedId, setSelectedId] = useState<string | null>(null); // Changed state

	// Get the base URL and extract the hostname
	const fullUrl = getBaseUrl();
	const { hostname } = new URL(fullUrl);

	const dataPlatformCardId = 'data-platform-card'; // Define layout ID

	return (
		<div className='text-primary-text flex w-full flex-grow flex-col overflow-y-auto p-4 sm:p-6 md:p-8'>
			{/* Hero Section */}
			<section className='mb-12 text-center md:mb-16'>
				<h1 className='text-primary mb-3 text-4xl font-bold sm:text-5xl md:text-6xl'>Welcome!</h1>
				<p className='text-secondary-text mb-4 text-lg sm:text-xl md:text-2xl'>
					The website of{' '}
					<a className='text-primary font-semibold hover:underline' href='https://www.linkedin.com/in/kevin-porter-6a80b7210/' rel='noopener noreferrer' target='_blank'>
						Kevin Porter
					</a>{' '}
					(aka{' '}
					<a className='text-primary font-semibold hover:underline' href='https://github.com/Lawlzer' rel='noopener noreferrer' target='_blank'>
						Lawlzer
					</a>
					).
				</p>
				<p className='text-md text-secondary-text mb-2 sm:text-lg'>A fully self-taught Senior Software Engineer with 7 years of experience, focused on backend development and deployment.</p>
				<p className='text-md text-secondary-text mb-2 sm:text-lg'>Launched 50+ projects securely and reliably, prioritizing efficiency and performance.</p>
				<p className='text-md text-secondary-text mb-6 sm:text-lg'>Experienced in best practices in security and performance, and developing backend solutions to solve any task in an efficient manner.</p>
				<a className='bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring inline-block rounded-md px-6 py-3 text-base font-semibold transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none' href='https://github.com/Lawlzer/lawlzer-website' rel='noopener noreferrer' target='_blank'>
					View Source Code on GitHub
				</a>
			</section>

			{/* Project Showcase Section */}
			<section>
				<h2 className='text-primary mb-8 text-center text-3xl font-semibold sm:text-4xl'>Featured Projects</h2>
				<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
					{/* Project 1: This Website */}
					<motion.div
						className='bg-secondary border-border flex flex-col rounded-lg border p-6 shadow-lg'
						initial={{ opacity: 0, x: -100 }} // Start invisible and off-screen left
						transition={{ duration: 0.5, ease: 'easeOut' }} // Animation timing
						viewport={{ once: true, amount: 0.2 }} // Trigger animation once when 20% visible
						whileInView={{ opacity: 1, x: 0 }} // Animate to visible and original position
					>
						<Image
							alt='This Website Placeholder'
							className='border-border mb-4 h-48 w-full rounded-md border object-cover' // Fixed height
							height={300}
							src='/placeholder.png'
							width={400}
						/>
						<div className='flex-grow'>
							<h3 className='text-primary mb-2 text-xl font-semibold'>{hostname} (This Website!)</h3>
							<p className='text-secondary-text mb-3 text-sm'>A personal portfolio and project hub built with Next.js, TypeScript, and Tailwind CSS.</p>
							<h4 className='text-md text-primary-text mb-1 font-medium'>Key Features:</h4>
							<ul className='text-secondary-text list-inside list-disc space-y-1 text-sm'>
								<li>
									<a className='text-primary hover:underline' href={getBaseUrl('colors')} rel='noopener noreferrer' target='_blank'>
										Dynamic Color Theming
									</a>
								</li>
								<li>
									<a className='text-primary hover:underline' href={getBaseUrl('valorant')} rel='noopener noreferrer' target='_blank'>
										Valorant Lineup Tool
									</a>
								</li>
								<li>Responsive & Mobile-First</li>
								<li>Perfect Google Lighthouse score</li>
							</ul>
						</div>
					</motion.div>

					{/* Project 2: Data Platform */}
					<motion.div
						className='bg-secondary border-border flex cursor-pointer flex-col rounded-lg border p-6 shadow-lg transition-shadow hover:shadow-xl'
						initial={{ opacity: 0, x: -100 }}
						layoutId={dataPlatformCardId} // Add layoutId
						transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }} // Kept original in-view transition
						viewport={{ once: true, amount: 0.2 }}
						whileInView={{ opacity: 1, x: 0 }}
						onClick={() => {
							setSelectedId(dataPlatformCardId);
						}} // Set selected ID on click
					>
						<Image
							alt='Data Platform Placeholder'
							className='border-border mb-4 h-48 w-full rounded-md border object-cover' // Fixed height
							height={300}
							src='/placeholder.png'
							width={400}
						/>
						<div className='flex-grow'>
							<h3 className='text-primary mb-2 text-xl font-semibold'>Data Platform</h3>
							<p className='text-secondary-text mb-3 text-sm'>Handled 2B+ Mongoose documents with real-time dynamic search capabilities, using USDA APIs.</p>
							<h4 className='text-md text-primary-text mb-1 font-medium'>Key Features:</h4>
							<ul className='text-secondary-text list-inside list-disc space-y-1 text-sm'>
								<li>Dynamic Mongoose DB for 2+ billion Mongoose documents</li>
								<li>Hourly USDA API integration</li>
								<li>AWS EC2 & Lambda deployment</li>
								<li>98% test coverage (Jest & Supertest)</li>
							</ul>
						</div>
					</motion.div>

					{/* Project 3: Web Scrapers */}
					<motion.div
						className='bg-secondary border-border flex flex-col rounded-lg border p-6 shadow-lg'
						initial={{ opacity: 0, x: -100 }}
						transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }} // Added slight delay
						viewport={{ once: true, amount: 0.2 }}
						whileInView={{ opacity: 1, x: 0 }}
					>
						<Image
							alt='Web Scrapers Placeholder'
							className='border-border mb-4 h-48 w-full rounded-md border object-cover' // Fixed height
							height={300}
							src='/placeholder.png'
							width={400}
						/>
						<div className='flex-grow'>
							<h3 className='text-primary mb-2 text-xl font-semibold'>Various Web Scrapers</h3>
							<p className='text-secondary-text mb-3 text-sm'>Developed Playwright solutions to extract data from 200+ complex websites monthly.</p>
							<h4 className='text-md text-primary-text mb-1 font-medium'>Techniques Used:</h4>
							<ul className='text-secondary-text list-inside list-disc space-y-1 text-sm'>
								<li>Rotating/Residential Proxies</li>
								<li>Captcha Solving & Temp-Mail</li>
								<li>Parallelism</li>
							</ul>
						</div>
					</motion.div>

					{/* Project 4: NPM Packages */}
					<motion.div
						className='bg-secondary border-border flex flex-col rounded-lg border p-6 shadow-lg'
						initial={{ opacity: 0, x: -100 }}
						transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }} // Added slight delay
						viewport={{ once: true, amount: 0.2 }}
						whileInView={{ opacity: 1, x: 0 }}
					>
						<Image
							alt='NPM Packages Placeholder'
							className='border-border mb-4 h-48 w-full rounded-md border object-cover' // Fixed height
							height={300}
							src='/placeholder.png'
							width={400}
						/>
						<div className='flex-grow'>
							<h3 className='text-primary mb-2 text-xl font-semibold'>High-Quality NPM Packages</h3>
							<p className='text-secondary-text mb-3 text-sm'>Implemented robust systems for maintaining code quality and developer tooling.</p>
							<h4 className='text-md text-primary-text mb-1 font-medium'>Key Aspects:</h4>
							<ul className='text-secondary-text list-inside list-disc space-y-1 text-sm'>
								<li>Extensive Testing & Strict ESLint</li>
								<li>Husky & Lint-Staged Integration</li>
								<li>GitHub Actions CI/CD</li>
							</ul>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Data Platform Overlay */}
			<AnimatePresence>
				{selectedId === dataPlatformCardId && ( // Check if the data platform card is selected
					<motion.div
						// Overlay background fades in
						animate={{ opacity: 1 }}
						className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4'
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						onClick={() => {
							setSelectedId(null);
						}} // Close on background click
					>
						{/* This motion.div is the expanding element linked by layoutId */}
						<motion.div
							className='bg-secondary border-border relative flex max-h-[98vh] w-11/12 max-w-[90vw] flex-col overflow-hidden rounded-lg border shadow-xl' // Increased size again
							// Add transition for the layout animation itself
							transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} // Example cubic bezier for smooth expand/collapse
							// Apply styles similar to the card but allow it to expand, constrained size (even larger)
							layoutId={dataPlatformCardId} // Use the same layoutId
							// Prevent content click from closing overlay by stopping propagation
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							{/* Close Button */}
							<button
								aria-label='Close data platform details'
								className='bg-background/60 text-foreground hover:bg-background/80 focus:ring-ring absolute top-3 right-3 z-10 rounded-full p-2 transition-colors focus:ring-2 focus:outline-none'
								type='button'
								onClick={(e) => {
									e.stopPropagation(); // Prevent background click
									setSelectedId(null);
								}}
							>
								<svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth={1.5} viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
									<path d='M6 18L18 6M6 6l12 12' strokeLinecap='round' strokeLinejoin='round' />
								</svg>
							</button>

							{/* Wrap content to manage internal layout and potentially fade in */}
							<motion.div
								animate={{ opacity: 1 }}
								className='h-full w-full overflow-y-auto' // Allow internal scrolling if needed
								exit={{ opacity: 0 }}
								initial={{ opacity: 0 }}
								transition={{ duration: 0.2, delay: 0.15 }} // Content fades in slightly after expansion
							>
								<DataPlatformPreview
									onClose={() => {
										setSelectedId(null);
									}}
								/>
							</motion.div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
