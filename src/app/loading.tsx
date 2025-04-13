import React from 'react';
import type { JSX } from 'react';

export default function Loading(): JSX.Element {
	// You can add any skeleton UI, spinner, etc. here
	return (
		<div className='flex h-full w-full items-center justify-center'>
			<p>Loading...</p> {/* Replace with a spinner or skeleton */}
		</div>
	);
}
