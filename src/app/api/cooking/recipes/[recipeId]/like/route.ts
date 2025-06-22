import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
	try {
		const session = await getSession();
		const { recipeId } = await params;

		const likeCount = await db.like.count({
			where: { recipeId },
		});

		let isLikedByUser = false;
		if (session?.user?.id != null && session.user.id !== '') {
			const userLike = await db.like.findFirst({
				where: {
					recipeId,
					userId: session.user.id,
				},
			});
			isLikedByUser = !!userLike;
		}

		return NextResponse.json({
			likeCount,
			isLikedByUser,
		});
	} catch (error) {
		console.error(`Error fetching likes for recipe:`, error);
		return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
	try {
		const session = await getSession();
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { recipeId } = await params;

		const existingLike = await db.like.findFirst({
			where: {
				recipeId,
				userId: session.user.id,
			},
		});

		if (existingLike) {
			// Unlike the recipe
			await db.like.delete({
				where: { id: existingLike.id },
			});
			return NextResponse.json({ success: true, action: 'unliked' });
		} else {
			// Like the recipe
			await db.like.create({
				data: {
					recipeId,
					userId: session.user.id,
				},
			});
			return NextResponse.json({ success: true, action: 'liked' });
		}
	} catch (error) {
		console.error(`Error liking/unliking recipe:`, error);
		return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 });
	}
}
