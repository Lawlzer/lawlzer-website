'use client';

import React from 'react';
import type { JSX } from 'react';
import Link from 'next/link'; // Import Link for navigation
import Image from 'next/image'; // Import Image for placeholders
import { getBaseUrl } from '~/lib/utils'; // Import getBaseUrl

export default function MainPage(): JSX.Element {
	// Get the base URL and extract the hostname
	let hostname = 'dev.lawlzer'; // Default fallback
	try {
		const fullUrl = getBaseUrl();
		hostname = new URL(fullUrl).hostname;
	} catch (error) {
		console.error('Failed to get base URL hostname:', error);
		// Keep the default hostname if getBaseUrl fails or URL parsing fails
	}

	return (
		<div className='flex flex-col flex-grow w-full p-4 sm:p-6 md:p-8 text-primary-text overflow-y-auto'>
			{/* Hero Section */}
			<section className='text-center mb-12 md:mb-16'>
				<h1 className='text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-primary'>Welcome!</h1>
				<p className='text-lg sm:text-xl md:text-2xl text-secondary-text mb-4'>
					The website of{' '}
					<a href='https://www.linkedin.com/in/kevin-porter-6a80b7210/' target='_blank' rel='noopener noreferrer' className='font-semibold text-primary hover:underline'>
						Kevin Porter
					</a>{' '}
					(aka{' '}
					<a href='https://github.com/Lawlzer' target='_blank' rel='noopener noreferrer' className='font-semibold text-primary hover:underline'>
						Lawlzer
					</a>
					).
				</p>
				<p className='text-md sm:text-lg text-secondary-text mb-2'>A fully self-taught Senior Software Engineer with 7 years of experience, focused on backend development and deployment.</p>
				<p className='text-md sm:text-lg text-secondary-text mb-2'>Launched 30+ projects securely and reliably, prioritizing minimal downtime.</p>
				<p className='text-md sm:text-lg text-secondary-text mb-6'>Enjoys collaborating, championing best practices in security and performance, and developing backend solutions.</p>
				<a href='https://github.com/Lawlzer/lawlzer-website' target='_blank' rel='noopener noreferrer' className='inline-block px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-base font-semibold transition-colors duration-200'>
					View Source Code on GitHub
				</a>
			</section>

			{/* Project Showcase Section */}
			<section>
				<h2 className='text-3xl sm:text-4xl font-semibold mb-8 text-center text-primary'>Featured Projects</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
					{/* Project 1: This Website */}
					<div className='bg-secondary rounded-lg shadow-lg p-6 border border-border flex flex-col'>
						<Image
							src='/placeholder.png'
							alt='This Website Placeholder'
							width={400}
							height={300}
							className='rounded-md object-cover w-full h-48 mb-4 border border-border' // Fixed height
						/>
						<div className='flex-grow'>
							<h3 className='text-xl font-semibold mb-2 text-primary'>{hostname} (This Website!)</h3>
							<p className='text-secondary-text text-sm mb-3'>A personal portfolio and project hub built with Next.js, TypeScript, and Tailwind CSS.</p>
							<h4 className='text-md font-medium mb-1 text-primary-text'>Key Features:</h4>
							<ul className='list-disc list-inside text-secondary-text text-sm space-y-1'>
								<li>
									<a href={getBaseUrl('colors')} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
										Dynamic Color Theming
									</a>
								</li>
								<li>
									<a href={getBaseUrl('valorant')} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
										Valorant Lineup Tool
									</a>
								</li>
								<li>Responsive & Mobile-First</li>
								<li>Perfect Google Lighthouse score</li>
							</ul>
						</div>
					</div>

					{/* Project 2: Data Platform */}
					<div className='bg-secondary rounded-lg shadow-lg p-6 border border-border flex flex-col'>
						<Image
							src='/placeholder.png'
							alt='Data Platform Placeholder'
							width={400}
							height={300}
							className='rounded-md object-cover w-full h-48 mb-4 border border-border' // Fixed height
						/>
						<div className='flex-grow'>
							<h3 className='text-xl font-semibold mb-2 text-primary'>Data Platform</h3>
							<p className='text-secondary-text text-sm mb-3'>Handled 2B+ Mongoose documents with real-time dynamic search capabilities, using USDA APIs.</p>
							<h4 className='text-md font-medium mb-1 text-primary-text'>Key Features:</h4>
							<ul className='list-disc list-inside text-secondary-text text-sm space-y-1'>
								<li>Dynamic Mongoose DB for 2+ billion Mongoose documents</li>
								<li>Hourly USDA API integration</li>
								<li>AWS EC2 & Lambda deployment</li>
								<li>98% test coverage (Jest & Supertest)</li>
							</ul>
						</div>
					</div>

					{/* Project 3: Web Scrapers */}
					<div className='bg-secondary rounded-lg shadow-lg p-6 border border-border flex flex-col'>
						<Image
							src='/placeholder.png'
							alt='Web Scrapers Placeholder'
							width={400}
							height={300}
							className='rounded-md object-cover w-full h-48 mb-4 border border-border' // Fixed height
						/>
						<div className='flex-grow'>
							<h3 className='text-xl font-semibold mb-2 text-primary'>Various Web Scrapers</h3>
							<p className='text-secondary-text text-sm mb-3'>Developed Playwright solutions to extract data from 200+ complex websites monthly.</p>
							<h4 className='text-md font-medium mb-1 text-primary-text'>Techniques Used:</h4>
							<ul className='list-disc list-inside text-secondary-text text-sm space-y-1'>
								<li>Rotating/Residential Proxies</li>
								<li>Captcha Solving & Temp-Mail</li>
								<li>Parallelism</li>
							</ul>
						</div>
					</div>

					{/* Project 4: NPM Packages */}
					<div className='bg-secondary rounded-lg shadow-lg p-6 border border-border flex flex-col'>
						<Image
							src='/placeholder.png'
							alt='NPM Packages Placeholder'
							width={400}
							height={300}
							className='rounded-md object-cover w-full h-48 mb-4 border border-border' // Fixed height
						/>
						<div className='flex-grow'>
							<h3 className='text-xl font-semibold mb-2 text-primary'>High-Quality NPM Packages</h3>
							<p className='text-secondary-text text-sm mb-3'>Implemented robust systems for maintaining code quality and developer tooling.</p>
							<h4 className='text-md font-medium mb-1 text-primary-text'>Key Aspects:</h4>
							<ul className='list-disc list-inside text-secondary-text text-sm space-y-1'>
								<li>Extensive Testing & Strict ESLint</li>
								<li>Husky & Lint-Staged Integration</li>
								<li>GitHub Actions CI/CD</li>
							</ul>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
