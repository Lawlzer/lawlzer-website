import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: Request, { params }: { params: { recipeId: string } }) {
	try {
		const comments = await db.comment.findMany({
			where: {
				recipeId: params.recipeId,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
		return NextResponse.json(comments);
	} catch (error) {
		console.error(`Error fetching comments for recipe ${params.recipeId}:`, error);
		return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
	}
}

export async function POST(request: Request, { params }: { params: { recipeId: string } }) {
	try {
		const session = await getSession();
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { content } = await request.json();
		if (content == null || typeof content !== 'string' || content.trim() === '') {
			return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
		}

		const newComment = await db.comment.create({
			data: {
				content: content.trim(),
				recipeId: params.recipeId,
				authorId: session.user.id,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});

		return NextResponse.json(newComment);
	} catch (error) {
		console.error(`Error creating comment for recipe ${params.recipeId}:`, error);
		return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
	}
}
