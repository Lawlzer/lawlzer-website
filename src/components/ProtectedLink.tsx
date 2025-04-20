'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LinkProps } from 'next/link';

interface ProtectedLinkProps extends LinkProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * A wrapper around Next.js Link component that checks for unsaved changes
 * before navigation using the global __NEXT_PROTECT_UNSAVED_CHANGES__ function.
 */
export default function ProtectedLink({ href, children, className, ...props }: ProtectedLinkProps): React.JSX.Element {
	// Safe check for testing environments where router might not be available
	let router;
	try {
		router = useRouter();
	} catch (e) {
		// Router is not available in test environment
	}

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
		// Convert href to string for comparison
		const targetPath = typeof href === 'string' ? href : href instanceof URL ? href.toString() : typeof href === 'object' && href !== null ? `${href.pathname ?? ''}${href.search ?? ''}${href.hash ?? ''}` : '';

		// Check if the window object exists (for SSR and testing)
		if (typeof window !== 'undefined' && window.__NEXT_PROTECT_UNSAVED_CHANGES__) {
			// Call the function to see if we should intercept
			const shouldIntercept = window.__NEXT_PROTECT_UNSAVED_CHANGES__(targetPath);

			if (shouldIntercept) {
				e.preventDefault();
				// Navigation will be handled by the function
				return;
			}
		}

		// Default behavior - allow navigation to proceed
	};

	return (
		<Link href={href} onClick={handleClick} className={className} {...props}>
			{children}
		</Link>
	);
}
