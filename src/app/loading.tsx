import type { JSX } from 'react';
import React from 'react';

const Loading = (): JSX.Element => (
	// You can add any skeleton UI, spinner, etc. here
	<div className='flex h-full w-full items-center justify-center'>
		<p>Loading...</p> {/* Replace with a spinner or skeleton */}
	</div>
);
export default Loading;
