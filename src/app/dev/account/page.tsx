import React from 'react';
import { auth } from '../../../server/auth';
import { env } from '../../../env';

export default async function DevAccountPage(): Promise<React.JSX.Element> {
	if (env.NODE_ENV !== 'development') {
		return (
			<div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white'>
				<h1 className='text-4xl font-bold'>Access Denied</h1>
				<p className='mt-4'>This page is only available in development mode.</p>
			</div>
		);
	}

	const session = await auth();

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white'>
			<h1 className='text-4xl font-bold'>Dev Account Info</h1>

			{session ? (
				<div className='mt-8 w-full max-w-2xl rounded-lg bg-white/10 p-6'>
					<h2 className='mb-4 text-2xl font-semibold'>User Session Data:</h2>
					<pre className='overflow-auto rounded bg-black/30 p-4 text-sm'>{JSON.stringify(session, null, 2)}</pre>
				</div>
			) : (
				<div className='mt-8 rounded-lg bg-white/10 p-6'>
					<p className='text-xl'>Not logged in. Please sign in to view account data.</p>
					<a href='/api/auth/signin' className='mt-4 block rounded-full bg-white/20 px-6 py-2 text-center font-semibold hover:bg-white/30'>
						Sign In
					</a>
				</div>
			)}
		</div>
	);
}
