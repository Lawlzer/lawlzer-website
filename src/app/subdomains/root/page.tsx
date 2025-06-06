'use client';

import { AnimatePresence, motion } from 'framer-motion'; // Import motion and AnimatePresence
// Import Image for placeholders
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

	const projects = [
		{
			id: 'website',
			title: `${hostname} (This Website!)`,
			description: 'A personal portfolio and project hub built with Next.js, TypeScript, and Tailwind CSS.',
			keyFeaturesTitle: 'Key Features:',
			features: [
				{ text: 'Dynamic Color Theming', link: getBaseUrl('colors') },
				{ text: 'Valorant Lineup Tool', link: getBaseUrl('valorant') },
				{ text: 'Responsive & Mobile-First', link: null },
				{ text: 'Perfect Google Lighthouse score', link: null },
			],
			icon: '🌐',
			gradient: 'from-blue-500 to-purple-600',
		},
		{
			id: dataPlatformCardId,
			title: 'Data Platform',
			description: 'Handled 2B+ Mongoose documents with real-time dynamic search capabilities, using USDA APIs.',
			keyFeaturesTitle: 'Key Features:',
			features: [
				{ text: 'Dynamic Mongoose DB for 2+ billion documents', link: null },
				{ text: 'Hourly USDA API integration', link: null },
				{ text: 'AWS EC2 & Lambda deployment', link: null },
				{ text: '98% test coverage (Jest & Supertest)', link: null },
			],
			icon: '📊',
			gradient: 'from-green-500 to-teal-600',
			isClickable: true,
		},
		{
			id: 'scrapers',
			title: 'Web Scraping Solutions',
			description: 'Developed Playwright solutions to extract data from 200+ complex websites monthly.',
			keyFeaturesTitle: 'Techniques Used:',
			features: [
				{ text: 'Rotating/Residential Proxies', link: null },
				{ text: 'Captcha Solving & Temp-Mail', link: null },
				{ text: 'Parallelism & Scalability', link: null },
			],
			icon: '🕷️',
			gradient: 'from-orange-500 to-red-600',
		},
		{
			id: 'npm',
			title: 'Open Source Contributions',
			description: 'Published high-quality NPM packages with robust testing and developer experience.',
			keyFeaturesTitle: 'Key Aspects:',
			features: [
				{ text: 'Extensive Testing & Strict ESLint', link: null },
				{ text: 'Husky & Lint-Staged Integration', link: null },
				{ text: 'GitHub Actions CI/CD', link: null },
			],
			icon: '📦',
			gradient: 'from-pink-500 to-rose-600',
		},
	];

	return (
		<div className='flex w-full flex-grow flex-col overflow-y-auto'>
			{/* Hero Section */}
			<section className='relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-primary/5 px-6 py-16 sm:px-8 md:py-24'>
				<div className='mx-auto max-w-6xl'>
					<motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.6 }}>
						<h1 className='mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl md:text-7xl'>Welcome!</h1>
						<p className='mx-auto mb-8 max-w-3xl text-xl text-secondary-text sm:text-2xl'>
							I&apos;m{' '}
							<a className='text-primary font-semibold transition-colors hover:text-primary/80' href='https://www.linkedin.com/in/kevin-porter-6a80b7210/' rel='noopener noreferrer' target='_blank'>
								Kevin Porter
							</a>{' '}
							(aka{' '}
							<a className='text-primary font-semibold transition-colors hover:text-primary/80' href='https://github.com/Lawlzer' rel='noopener noreferrer' target='_blank'>
								Lawlzer
							</a>
							)
						</p>
						<div className='mx-auto mb-10 max-w-2xl space-y-3 text-lg text-secondary-text'>
							<p>A fully self-taught Senior Software Engineer with 7 years of experience</p>
							<p>Specialized in backend development, deployment, and scalable solutions</p>
							<p>Launched 50+ projects with a focus on security, performance, and reliability</p>
						</div>
						<motion.a className='inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2' href='https://github.com/Lawlzer/lawlzer-website' rel='noopener noreferrer' target='_blank' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
							<svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
								<path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
							</svg>
							View Source Code
						</motion.a>
					</motion.div>
				</div>
			</section>

			{/* Project Showcase Section */}
			<section className='px-6 py-16 sm:px-8'>
				<div className='mx-auto max-w-6xl'>
					<motion.h2 className='mb-12 text-center text-4xl font-bold text-primary sm:text-5xl' initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
						Featured Projects
					</motion.h2>
					<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
						{projects.map((project, index) => (
							<motion.div
								key={project.id}
								className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary/50 to-secondary shadow-lg transition-all hover:shadow-2xl ${project.isClickable ? 'cursor-pointer' : ''}`}
								initial={{ opacity: 0, y: 30 }}
								layoutId={project.isClickable ? project.id : undefined}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true, amount: 0.2 }}
								whileInView={{ opacity: 1, y: 0 }}
								onClick={
									project.isClickable
										? () => {
												setSelectedId(project.id);
											}
										: undefined
								}
							>
								{/* Gradient overlay */}
								<div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 transition-opacity group-hover:opacity-10`} />

								{/* Card content */}
								<div className='relative p-8'>
									{/* Icon */}
									<div className='mb-4 text-5xl'>{project.icon}</div>

									{/* Title and description */}
									<h3 className='mb-3 text-2xl font-bold text-primary'>{project.title}</h3>
									<p className='mb-4 text-secondary-text'>{project.description}</p>

									{/* Features */}
									<div>
										<h4 className='mb-2 text-sm font-semibold uppercase tracking-wide text-primary-text/80'>{project.keyFeaturesTitle}</h4>
										<ul className='space-y-2'>
											{project.features.map((feature, featureIndex) => (
												<li key={featureIndex} className='flex items-start'>
													<span className='mr-2 mt-1 text-primary'>•</span>
													{feature.link !== null ? (
														<a
															className='text-secondary-text transition-colors hover:text-primary'
															href={feature.link}
															rel='noopener noreferrer'
															target='_blank'
															onClick={(e) => {
																e.stopPropagation();
															}}
														>
															{feature.text}
														</a>
													) : (
														<span className='text-secondary-text'>{feature.text}</span>
													)}
												</li>
											))}
										</ul>
									</div>

									{/* Click indicator for clickable cards */}
									{project.isClickable && (
										<div className='mt-6 flex items-center text-sm text-primary'>
											<span>Click to explore</span>
											<svg className='ml-1 h-4 w-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
											</svg>
										</div>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Data Platform Overlay */}
			<AnimatePresence>
				{selectedId === dataPlatformCardId && (
					<motion.div
						animate={{ opacity: 1 }}
						className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-4'
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						onClick={() => {
							setSelectedId(null);
						}}
					>
						<motion.div
							className='relative flex max-h-[95vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-xl bg-background shadow-2xl'
							layoutId={dataPlatformCardId}
							transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							{/* Close Button */}
							<button
								aria-label='Close data platform details'
								className='absolute top-4 right-4 z-10 rounded-full bg-background/80 p-2 text-foreground backdrop-blur-sm transition-all hover:bg-background hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary'
								type='button'
								onClick={(e) => {
									e.stopPropagation();
									setSelectedId(null);
								}}
							>
								<svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
								</svg>
							</button>

							{/* Content */}
							<motion.div animate={{ opacity: 1 }} className='h-full w-full overflow-y-auto' exit={{ opacity: 0 }} initial={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.15 }}>
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
