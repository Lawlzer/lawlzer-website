import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

const suggestionSchema = z.object({
	originalItemId: z.string(),
	foodId: z.string().optional(),
	recipeId: z.string().optional(),
	amount: z.number().min(0.1),
	unit: z.string(),
	notes: z.string().optional(),
});

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const itemId = searchParams.get('itemId');

		if (itemId === null || itemId === '') {
			return NextResponse.json({ error: 'originalItemId is required' }, { status: 400 });
		}

		const alternatives = await db.ingredientAlternative.findMany({
			where: { originalItemId: itemId },
			include: {
				food: { select: { name: true } },
				recipe: { select: { name: true } },
			},
			orderBy: {
				upvotes: 'desc',
			},
		});

		return NextResponse.json(alternatives);
	} catch (error) {
		console.error('Error fetching alternatives:', error);
		return NextResponse.json({ error: 'Failed to fetch alternatives' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const session = await getSession();
		if (session?.user?.id === undefined || session.user.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const validation = suggestionSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json({ error: 'Invalid data', details: validation.error.errors }, { status: 400 });
		}

		const { originalItemId, foodId, recipeId, amount, unit, notes } = validation.data;

		if (foodId === undefined && recipeId === undefined) {
			return NextResponse.json({ error: 'Either foodId or recipeId must be provided' }, { status: 400 });
		}

		const newAlternative = await db.ingredientAlternative.create({
			data: {
				originalItemId,
				foodId,
				recipeId,
				amount,
				unit,
				notes,
				suggestedById: session.user.id,
			},
		});

		return NextResponse.json(newAlternative);
	} catch (error) {
		console.error('Error creating ingredient alternative:', error);
		return NextResponse.json({ error: 'Failed to suggest alternative' }, { status: 500 });
	}
}

const voteSchema = z.object({
	alternativeId: z.string(),
	voteType: z.enum(['upvote', 'downvote']),
});

export async function PUT(request: Request) {
	try {
		const session = await getSession();
		if (session?.user?.id === undefined || session.user.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const validation = voteSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json({ error: 'Invalid data', details: validation.error.errors }, { status: 400 });
		}

		const { alternativeId, voteType } = validation.data;

		const increment = voteType === 'upvote' ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } };

		const updatedAlternative = await db.ingredientAlternative.update({
			where: { id: alternativeId },
			data: increment,
		});

		return NextResponse.json(updatedAlternative);
	} catch (error) {
		console.error('Error voting on alternative:', error);
		return NextResponse.json({ error: 'Failed to vote on alternative' }, { status: 500 });
	}
}
