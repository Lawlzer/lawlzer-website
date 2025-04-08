import type { JSX } from 'react';

export default function TestPage(): JSX.Element {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white'>
			<h1 className='text-4xl font-bold'>Test Page</h1>
			<p className='mt-4'>This is a simple test page that doesn't use the database.</p>
		</div>
	);
}
