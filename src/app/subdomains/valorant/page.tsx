'use client';

import React from 'react';
import type { JSX } from 'react';
import ValorantLineupClient from './components/ValorantLineupClient';

export default function ValorantPage(): JSX.Element {
	return (
		<div className='flex flex-col w-full h-full'>
			<ValorantLineupClient />
		</div>
	);
}
