'use client';

import { useState, type JSX } from 'react';

import { api } from '~/trpc/react';

export function LatestPost(): JSX.Element {
	const [latestPost] = api.post.getLatest.useSuspenseQuery();

	const utils = api.useUtils();
	const [name, setName] = useState('');

	const handleSuccess = async (): Promise<void> => {
		await utils.post.invalidate();
		setName('');
	};

	const createPost = api.post.create.useMutation();

	return (
		<div className='w-full max-w-xs'>
			{latestPost ? <p className='truncate'>Your most recent post: {latestPost.name}</p> : <p>You have no posts yet.</p>}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					createPost.mutate(
						{ name },
						{
							onSuccess: () => {
								handleSuccess().catch((error) => {
									console.error('Error during post creation success handling:', error);
								});
							},
						}
					);
				}}
				className='flex flex-col gap-2'
			>
				<input
					type='text'
					placeholder='Title'
					value={name}
					onChange={(e) => {
						setName(e.target.value);
					}}
					className='w-full rounded-full bg-white/10 px-4 py-2 text-white'
				/>
				<button type='submit' className='rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20' disabled={createPost.isPending}>
					{createPost.isPending ? 'Submitting...' : 'Submit'}
				</button>
			</form>
		</div>
	);
}
