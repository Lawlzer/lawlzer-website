'use client';

import type { JSX } from 'react';
import React, { useEffect } from 'react';

import ValorantLineupClient from './components/ValorantLineupClient';

export default function ValorantPage(): JSX.Element {
	// Hide skip links on this page by adding a class that CSS can target
	useEffect(() => {
		const skipLinks = document.querySelectorAll('a[href="#main-content"], a[href="#navigation"]');
		skipLinks.forEach((link) => {
			link.classList.add('!hidden');
		});

		return () => {
			skipLinks.forEach((link) => {
				link.classList.remove('!hidden');
			});
		};
	}, []);

	return (
		<div className='h-[calc(100vh-4rem)] w-full overflow-hidden' style={{ touchAction: 'manipulation' }}>
			<ValorantLineupClient />
		</div>
	);
}
