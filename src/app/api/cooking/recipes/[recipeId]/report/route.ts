import { NextResponse } from 'next/server';

import { getSession } from '~/server/db/session';

export async function POST(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
	const session = await getSession();
	if (session?.user?.id == null) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { reason } = await request.json();
	const { recipeId } = await params;

	if (!reason) {
		return NextResponse.json({ error: 'A reason is required to submit a report.' }, { status: 400 });
	}

	// TODO: Implement actual report creation when schema is unblocked
	console.info(`Recipe ${recipeId} reported by ${session.user.id} for reason: ${reason}`);

	return NextResponse.json({
		success: true,
		message: 'Recipe reported successfully.',
	});
}
