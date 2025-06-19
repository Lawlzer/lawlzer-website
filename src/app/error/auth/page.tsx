'use client';

import { ArrowPathIcon, ExclamationCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function getErrorMessage(errorCode: string | null): { title: string; description: string } {
	switch (errorCode) {
		case 'invalid_state':
			return {
				title: 'Session Expired',
				description: 'Your authentication session has expired or there was a security issue. Please try signing in again.',
			};
		case 'no_code':
			return {
				title: 'Authorization Failed',
				description: "We didn't receive the necessary authorization from your provider. Please try again.",
			};
		case 'server_error':
			return {
				title: 'Server Error',
				description: 'Our servers encountered an error. Please try again in a few moments.',
			};
		case null:
		default:
			return {
				title: 'Authentication Error',
				description: 'Something went wrong during the authentication process. Please try again.',
			};
	}
}

const AuthErrorPage = (): React.JSX.Element => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const errorCode = searchParams.get('error');
	const { title, description } = getErrorMessage(errorCode);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const handleTryAgain = (): void => {
		router.push('/');
	};

	if (!isClient) {
		return <div className='relative flex min-h-screen items-center justify-center p-4' />;
	}

	return (
		<div className='relative flex min-h-screen items-center justify-center p-4'>
			{/* Background Pattern */}
			<div className='absolute inset-0 -z-10 bg-grid-pattern opacity-5' />

			{/* Gradient Overlay */}
			<div className='absolute inset-0 -z-10 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5' />

			<motion.div animate={{ opacity: 1, y: 0 }} className='w-full max-w-md' initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
				<div className='relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-2xl'>
					{/* Error Icon */}
					<motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10' transition={{ duration: 0.5, delay: 0.2 }}>
						<ExclamationCircleIcon className='h-10 w-10 text-destructive' />
					</motion.div>

					{/* Error Title */}
					<motion.h1 animate={{ opacity: 1 }} className='mb-3 text-center text-2xl font-bold text-foreground' initial={{ opacity: 0 }} transition={{ delay: 0.3 }}>
						{title}
					</motion.h1>

					{/* Error Description */}
					<motion.p animate={{ opacity: 1 }} className='mb-8 text-center text-muted-foreground' initial={{ opacity: 0 }} transition={{ delay: 0.4 }}>
						{description}
					</motion.p>

					{/* Error Code Badge */}
					{errorCode !== null && errorCode !== '' && (
						<motion.div animate={{ opacity: 1 }} className='mb-6 flex justify-center' initial={{ opacity: 0 }} transition={{ delay: 0.5 }}>
							<span className='rounded-full bg-muted px-3 py-1 text-xs font-mono text-muted-foreground'>Error Code: {errorCode}</span>
						</motion.div>
					)}

					{/* Action Buttons */}
					<motion.div animate={{ opacity: 1 }} className='space-y-3' initial={{ opacity: 0 }} transition={{ delay: 0.7 }} suppressHydrationWarning>
						<button className='group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg' onClick={handleTryAgain} type='button'>
							<ArrowPathIcon className='h-4 w-4 transition-transform group-hover:rotate-180' />
							Try Again
						</button>

						<Link className='flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground' href='/'>
							<HomeIcon className='h-4 w-4' />
							Return to Homepage
						</Link>
					</motion.div>

					{/* Decorative Elements */}
					<div className='absolute -right-20 -top-20 h-40 w-40 rounded-full bg-destructive/5 blur-3xl' />
					<div className='absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-destructive/5 blur-3xl' />
				</div>

				{/* Help Text */}
				<motion.p animate={{ opacity: 1 }} className='mt-6 text-center text-sm text-muted-foreground' initial={{ opacity: 0 }} transition={{ delay: 0.8 }}>
					Need help?{' '}
					<Link className='text-primary underline-offset-4 hover:underline' href='/contact'>
						Contact Support
					</Link>
				</motion.p>
			</motion.div>
		</div>
	);
};

export default AuthErrorPage;
