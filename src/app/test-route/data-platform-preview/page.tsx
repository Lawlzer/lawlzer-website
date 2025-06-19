'use client';

import { usePathname } from 'next/navigation';
import type { JSX } from 'react';
import React from 'react';

import DataPlatformPreview from '~/app/subdomains/root/components/DataPlatformPreview';

// Simple wrapper page to render the component for Playwright tests
export default function DataPlatformPreviewTestPage(): JSX.Element {
	// A simple way to handle close in a test environment might be to navigate away
	// or just log it. For this test page, we can make it a no-op or log.
	const pathname = usePathname();
	const handleClose = (): void => {
		console.info('Close button clicked on test page:', pathname);
		// You could potentially navigate back or to a different page if needed
		// e.g., window.history.back();
	};

	// Render the component within a basic layout structure if needed,
	// or just directly for isolation.
	return (
		<div className='bg-background flex min-h-screen items-center justify-center'>
			{/* Ensure the component receives the required props */}
			<DataPlatformPreview onClose={handleClose} />
		</div>
	);
}

// Optional: Add metadata if desired, though likely not necessary for a test route
// export const metadata = {
// 	title: 'Test - Data Platform Preview',
// };
