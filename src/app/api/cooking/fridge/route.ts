import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET() {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const fridgeItems = await db.fridgeItem.findMany({
		where: { userId: session.user.id },
		include: { food: true },
		orderBy: { food: { name: 'asc' } },
	});

	return NextResponse.json(fridgeItems);
}

const postSchema = z.object({
	foodId: z.string(),
	quantity: z.number().min(0.1),
});

export async function POST(request: Request) {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const validation = postSchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	}

	const { foodId, quantity } = validation.data;

	const newItem = await db.fridgeItem.create({
		data: {
			userId: session.user.id,
			foodId,
			quantity,
		},
		include: { food: true },
	});

	return NextResponse.json(newItem);
}

export async function DELETE(request: Request) {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');

	if (id === null || id === '') {
		return NextResponse.json({ error: 'ID is required' }, { status: 400 });
	}

	await db.fridgeItem.delete({
		where: { id, userId: session.user.id },
	});

	return NextResponse.json({ success: true });
}
