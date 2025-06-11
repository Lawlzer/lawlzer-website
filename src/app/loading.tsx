import type { JSX } from 'react';
import React from 'react';

const Loading = (): JSX.Element => (
	<div className='flex h-full w-full items-center justify-center'>
		<div className='relative'>
			{/* Outer ring with gradient */}
			<div className='h-16 w-16 animate-spin rounded-full bg-gradient-to-r from-primary via-primary/50 to-transparent p-1'>
				<div className='h-full w-full rounded-full bg-background' />
			</div>
			{/* Inner dot */}
			<div className='absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary' />
		</div>
	</div>
);

export default Loading;
