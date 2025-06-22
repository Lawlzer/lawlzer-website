import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

const dayEntrySchema = z.object({
	date: z.string(), // ISO date string 'YYYY-MM-DD'
	entry: z.object({
		foodId: z.string().optional().nullable(),
		recipeId: z.string().optional().nullable(), // This should be recipeVersionId in the future
		amount: z.number().min(0),
		mealType: z.string(),
		calories: z.number(),
		protein: z.number(),
		carbs: z.number(),
		fat: z.number(),
		fiber: z.number(),
		sugar: z.number(),
		sodium: z.number(),
	}),
});

export async function POST(request: Request) {
	try {
		const session = await getSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const validation = dayEntrySchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json({ error: 'Invalid data format', details: validation.error.errors }, { status: 400 });
		}

		const { date, entry } = validation.data;
		const dayDate = new Date(date);

		// Find or create the day
		const day = await db.day.upsert({
			where: {
				userId_date: {
					userId: session.user.id,
					date: dayDate,
				},
			},
			create: {
				userId: session.user.id,
				date: dayDate,
			},
			update: {},
		});

		// Find the recipe version ID if a recipeId is passed
		let recipeVersionId: string | null = null;
		if (entry.recipeId) {
			const recipe = await db.recipe.findUnique({
				where: { id: entry.recipeId },
				select: { currentVersionId: true },
			});
			if (recipe) {
				recipeVersionId = recipe.currentVersionId;
			}
		}

		const newEntry = await db.dayEntry.create({
			data: {
				dayId: day.id,
				foodId: entry.foodId,
				recipeVersionId: recipeVersionId,
				amount: entry.amount,
				mealType: entry.mealType,
				calories: entry.calories,
				protein: entry.protein,
				carbs: entry.carbs,
				fat: entry.fat,
				fiber: entry.fiber,
				sugar: entry.sugar,
				sodium: entry.sodium,
			},
		});

		return NextResponse.json(newEntry);
	} catch (error) {
		console.error('Error creating day entry:', error);
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
		}
		return NextResponse.json({ error: 'Failed to create day entry' }, { status: 500 });
	}
}
