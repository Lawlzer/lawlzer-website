import { NextResponse } from 'next/server';

// import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(_request: Request, { params: _params }: { params: Promise<{ recipeId: string }> }) {
	// TODO: Implement actual dislike fetching when schema is unblocked
	const dislikeCount = Math.floor(Math.random() * 10);
	let isDislikedByUser = Math.random() > 0.5;

	const session = await getSession();
	if (session?.user?.id == null) {
		isDislikedByUser = false;
	}

	return NextResponse.json({
		dislikeCount,
		isDislikedByUser,
	});
}

export async function POST(_request: Request, { params: _params }: { params: Promise<{ recipeId: string }> }) {
	const session = await getSession();
	if (session?.user?.id == null) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// TODO: Implement actual dislike toggling when schema is unblocked
	// In a real implementation, you would check if a dislike exists,
	// then either create or delete it from the 'Dislike' table.

	return NextResponse.json({ success: true, action: 'toggled' });
}
