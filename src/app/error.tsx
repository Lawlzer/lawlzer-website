'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error('Application error:', error);
	}, [error]);

	return (
		<div className='flex min-h-screen items-center justify-center bg-background p-4'>
			<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className='max-w-md w-full rounded-2xl bg-card p-8 shadow-xl border border-border'>
				<div className='flex flex-col items-center text-center'>
					<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
						<ExclamationTriangleIcon className='h-8 w-8 text-destructive' />
					</motion.div>

					<h1 className='mb-2 text-2xl font-bold text-foreground'>Something went wrong!</h1>

					<p className='mb-6 text-secondary-text'>We apologize for the inconvenience. An unexpected error has occurred.</p>

					{error.digest !== undefined && error.digest !== null && <p className='mb-6 font-mono text-xs text-secondary-text'>Error ID: {error.digest}</p>}

					<div className='flex gap-3'>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={reset} className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all'>
							Try again
						</motion.button>

						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => (window.location.href = '/')} className='rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-all'>
							Go home
						</motion.button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
