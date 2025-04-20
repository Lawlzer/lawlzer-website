'use client';

import React from 'react';
import type { JSX } from 'react';
import { COOKIE_KEYS, DEFAULT_COLORS, setCookie } from '~/lib/palette';

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
	// Removed color state initialization

	// Removed color application useEffect hook

	return (
		<div className='flex flex-col flex-grow w-full p-4 sm:p-6 md:p-8'>
			<h1>Main Domain Page</h1>
			<p className='mt-2 text-muted-foreground'>This is the page for the main domain.</p>

			{/* Removed color customization section */}
		</div>
	);
}
