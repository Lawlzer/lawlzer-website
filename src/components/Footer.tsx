import React from 'react';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className='border-t border-border bg-background'>
			<div className='container mx-auto px-4 py-6'>
				<p className='text-center text-sm text-muted-foreground'>
					© {currentYear} Lawlzer. All rights reserved.
				</p>
			</div>
		</footer>
	);
}