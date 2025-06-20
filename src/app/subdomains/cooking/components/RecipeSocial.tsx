'use client';

import type { User } from '@prisma/client';
import { useEffect, useState } from 'react';

interface Comment {
	id: string;
	content: string;
	createdAt: string;
	author: {
		id: string;
		name: string | null;
		image: string | null;
	};
}

interface LikeInfo {
	likeCount: number;
	isLikedByUser: boolean;
}

interface RecipeSocialProps {
	recipeId: string;
	currentUser: User | null;
}

export function RecipeSocial({ recipeId, currentUser }: RecipeSocialProps) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [likeInfo, setLikeInfo] = useState<LikeInfo>({
		likeCount: 0,
		isLikedByUser: false,
	});
	const [newComment, setNewComment] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [commentsRes, likesRes] = await Promise.all([fetch(`/api/cooking/recipes/${recipeId}/comments`), fetch(`/api/cooking/recipes/${recipeId}/like`)]);
				const commentsData = await commentsRes.json();
				const likesData = await likesRes.json();
				setComments(commentsData);
				setLikeInfo(likesData);
			} catch (error) {
				console.error('Error fetching social data:', error);
			} finally {
				setIsLoading(false);
			}
		};
		void fetchData();
	}, [recipeId]);

	const handleLike = async () => {
		if (!currentUser) return; // Or prompt to login
		const originalLikeInfo = { ...likeInfo };

		setLikeInfo((prev) => ({
			likeCount: prev.isLikedByUser ? prev.likeCount - 1 : prev.likeCount + 1,
			isLikedByUser: !prev.isLikedByUser,
		}));

		try {
			const response = await fetch(`/api/cooking/recipes/${recipeId}/like`, { method: 'POST' });
			if (!response.ok) {
				setLikeInfo(originalLikeInfo);
			}
		} catch (error) {
			console.error('Error liking recipe:', error);
			setLikeInfo(originalLikeInfo);
		}
	};

	const handleCommentSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim() || !currentUser) return;

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/cooking/recipes/${recipeId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newComment }),
			});

			if (response.ok) {
				const createdComment = await response.json();
				setComments((prev) => [createdComment, ...prev]);
				setNewComment('');
			}
		} catch (error) {
			console.error('Error posting comment:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-6'>
			{/* Likes Section */}
			<div className='flex items-center gap-4'>
				<button onClick={() => void handleLike()} disabled={!currentUser} className='flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'>
					<svg className={`w-5 h-5 ${likeInfo.isLikedByUser ? 'text-red-500 fill-current' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z' />
					</svg>
					<span>{likeInfo.likeCount}</span>
				</button>
				{/* Comment and Report buttons can go here */}
			</div>

			{/* Comments Section */}
			<div className='space-y-4'>
				<h3 className='font-semibold text-lg'>Comments ({comments.length})</h3>

				{/* New Comment Form */}
				{currentUser && (
					<form onSubmit={(e) => void handleCommentSubmit(e)} className='flex items-start gap-2'>
						<textarea
							value={newComment}
							onChange={(e) => {
								setNewComment(e.target.value);
							}}
							placeholder='Add a comment...'
							className='flex-1 px-3 py-2 border rounded-lg'
							rows={2}
						/>
						<button type='submit' className='px-4 py-2 bg-blue-500 text-white rounded-lg' disabled={isSubmitting}>
							{isSubmitting ? 'Posting...' : 'Post'}
						</button>
					</form>
				)}

				{/* Comment List */}
				<div className='space-y-3'>
					{comments.map((comment) => (
						<div key={comment.id} className='p-3 bg-gray-50 dark:bg-gray-900 rounded-lg'>
							<p>{comment.content}</p>
							<p className='text-xs text-gray-500 mt-2'>
								- {comment.author.name ?? 'Anonymous'} on {new Date(comment.createdAt).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
