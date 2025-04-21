'use client';

import React from 'react';
import type { JSX } from 'react';
import Link from 'next/link'; // Import Link for navigation
import Image from 'next/image'; // Import Image for placeholders
import { getBaseUrl } from '~/lib/utils'; // Import getBaseUrl

// Define COOKIE keys (matching layout.tsx)
// const COOKIE_KEYS = {
// 	PAGE_BG: 'theme_page_bg',
// 	FG_COLOR: 'theme_fg_color',
// 	PRIMARY_COLOR: 'theme_primary_color',
// };

// Define default colors (used for initial state and fallback)
// const DEFAULT_COLORS = {
// 	PAGE_BG: '#640175',
// 	FG_COLOR: '#f0e0f8',
// 	PRIMARY_COLOR: '#bb0fd9',
// };

// Helper function to set cookies client-side
// function setCookie(name: string, value: string, days: number = 365): void {
// 	try {
// 		let expires = '';
// 		if (days) {
// 			const date = new Date();
// 			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
// 			expires = '; expires=' + date.toUTCString();
// 		}
// 		document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
// 	} catch (error) {
// 		console.error('Failed to set cookie:', name, error);
// 	}
// }

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
		<div className='flex flex-col flex-grow w-full p-4 sm:p-6 md:p-8 text-primary-text'>
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
				<p className='text-md sm:text-lg text-secondary-text mb-6'>Exploring code, creating solutions, and sharing the journey.</p>
				<a href='https://github.com/Lawlzer/lawlzer-website' target='_blank' rel='noopener noreferrer' className='inline-block px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-base font-semibold transition-colors duration-200'>
					View Source on GitHub
				</a>
			</section>

			{/* Project Showcase Section */}
			<section>
				<h2 className='text-3xl sm:text-4xl font-semibold mb-8 text-center text-primary'>Featured Projects</h2>
				<div className='bg-secondary rounded-lg shadow-lg p-6 md:p-8 border border-border flex flex-col md:flex-row items-center gap-6 md:gap-8'>
					{/* Placeholder Image */}
					<div className='w-full md:w-1/3 flex-shrink-0'>
						<Image
							src='/placeholder.png' // Replace with your actual image path
							alt='Project Placeholder'
							width={400} // Adjust as needed
							height={300} // Adjust as needed
							className='rounded-md object-cover w-full h-auto border border-border'
						/>
					</div>
					{/* Project Details */}
					<div className='flex-grow'>
						<h3 className='text-2xl font-semibold mb-3 text-primary'>{hostname} (This Website!)</h3>
						<p className='text-secondary-text mb-4'>A personal portfolio and project hub built with Next.js, TypeScript, and Tailwind CSS, designed for scalability and a seamless user experience across all devices.</p>
						<h4 className='text-lg font-medium mb-2 text-primary-text'>Key Features:</h4>
						<ul className='list-disc list-inside text-secondary-text space-y-1 mb-4'>
							<li>
								<a href={getBaseUrl('colors')} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
									Dynamic Color Theming
								</a>
								: Customize the entire website's color palette live!
							</li>
							<li>
								<a href={getBaseUrl('valorant')} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
									Valorant Lineup Tool
								</a>
								: Quickly find and view Valorant agent lineups.
							</li>
							<li>Responsive & Mobile-First: Great UI/UX on any screen size.</li>
						</ul>
						<p className='text-sm text-muted-foreground'>(More projects coming soon...)</p>
					</div>
				</div>
			</section>

			{/* Optional: Add other sections like About Me, Contact, etc. here */}
		</div>
	);
}
