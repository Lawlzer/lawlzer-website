'use client';

import type { JSX } from 'react';
import React from 'react';

import ValorantLineupClient from './components/ValorantLineupClient';

export default function ValorantPage(): JSX.Element {
	return (
		<div className='flex h-full w-full flex-col'>
			<ValorantLineupClient />
		</div>
	);
}
