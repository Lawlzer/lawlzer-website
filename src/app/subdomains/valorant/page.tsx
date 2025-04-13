import React from 'react';
import type { JSX } from 'react';
import type { Metadata } from 'next';
import ValorantLineupClient from './components/ValorantLineupClient';

export const metadata: Metadata = {
	title: 'Valorant Lineups',
};

export default function ValorantPage(): JSX.Element {
	return (
		<div className='flex flex-col w-full h-full'>
			<ValorantLineupClient />
		</div>
	);
}
