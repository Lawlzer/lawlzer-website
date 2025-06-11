'use client';

import type { LinkProps } from 'next/link';
import Link from 'next/link';
import React from 'react';

interface ProtectedLinkProps extends LinkProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * A wrapper around Next.js Link component that checks for unsaved changes
 * before navigation using the global __NEXT_PROTECT_UNSAVED_CHANGES__ function.
 */
export default function ProtectedLink({ href, children, className, ...props }: ProtectedLinkProps): React.JSX.Element {
	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
		// Convert href to string for comparison
		const targetPath = typeof href === 'string' ? href : href instanceof URL ? href.toString() : typeof href === 'object' && href !== null ? `${href.pathname ?? ''}${href.search ?? ''}${href.hash ?? ''}` : '';

		// Check if the window object exists (for SSR and testing)
		if (typeof window !== 'undefined' && window.__NEXT_PROTECT_UNSAVED_CHANGES__) {
			try {
				// Call the function to see if we should intercept
				const shouldIntercept = window.__NEXT_PROTECT_UNSAVED_CHANGES__(targetPath);

				if (shouldIntercept) {
					e.preventDefault();
					// Navigation will be handled by the function
					return;
				}
			} catch (error) {
				// If the protection function throws, log the error but allow navigation
				console.error('Error in navigation protection function:', error);
				// Continue with default navigation behavior
			}
		}

		// Default behavior - allow navigation to proceed
	};

	return (
		<Link className={className} href={href} onClick={handleClick} {...props}>
			{children}
		</Link>
	);
}
