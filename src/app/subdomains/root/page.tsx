import React from 'react';
import type { JSX } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Lawlzer's Homepage",
};

export default function MainPage(): JSX.Element {
	return (
		<div className='flex flex-col flex-grow w-full bg-background-primary text-text-primary'>
			<h1>Main Domain Page</h1>
			<p>This is the page for the main domain.</p>
		</div>
	);
}
