'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function getErrorMessage(errorCode: string | null): string {
	switch (errorCode) {
		case 'invalid_state':
			return 'Authentication failed due to an invalid state. This could happen if the session expired or if there was a CSRF attempt.';
		case 'no_code':
			return 'Authentication failed because no authorization code was received from the provider.';
		case 'server_error':
			return 'There was a server error during authentication. Please try again later.';
		case null:
			return 'An unknown error occurred during authentication.';
		default:
			return 'An unknown error occurred during authentication.';
	}
}

const AuthErrorPage = (): React.JSX.Element => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [countdown, setCountdown] = useState(5);
	const errorCode = searchParams.get('error');
	const errorMessage = getErrorMessage(errorCode);

	useEffect(() => {
		const timer = setTimeout(() => {
			router.push('/');
		}, 5000);

		const countdownInterval = setInterval(() => {
			setCountdown((prev) => prev - 1);
		}, 1000);

		return () => {
			clearTimeout(timer);
			clearInterval(countdownInterval);
		};
	}, [router]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center p-4'>
			<div className='mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg'>
				<h1 className='mb-4 text-2xl font-bold text-red-600'>Authentication Error</h1>
				<p className='mb-6 text-gray-600'>{errorMessage}</p>
				<p className='mb-4 text-sm text-gray-500'>
					Redirecting to homepage in {countdown} second{countdown !== 1 ? 's' : ''}...
				</p>
				<Link className='inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75' href='/'>
					Return to Home
				</Link>
			</div>
		</div>
	);
};

export default AuthErrorPage;
