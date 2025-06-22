import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function POST(request: Request) {
	try {
		const session = await getSession();
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { sourceDate, targetDate } = await request.json();

		if (!sourceDate || !targetDate) {
			return NextResponse.json({ error: 'Source and target dates are required' }, { status: 400 });
		}

		const sourceDay = await db.day.findFirst({
			where: {
				userId: session.user.id,
				date: new Date(sourceDate),
			},
			include: {
				entries: true,
			},
		});

		if (!sourceDay) {
			return NextResponse.json({ error: 'Source day not found' }, { status: 404 });
		}

		// Create or update the target day
		const targetDay = await db.day.upsert({
			where: {
				userId_date: {
					userId: session.user.id,
					date: new Date(targetDate),
				},
			},
			update: {
				// Clear existing entries before duplicating
				entries: {
					deleteMany: {},
				},
			},
			create: {
				userId: session.user.id,
				date: new Date(targetDate),
			},
		});

		// Duplicate the entries
		if (sourceDay.entries.length > 0) {
			const entriesToCreate = sourceDay.entries.map((entry) => ({
				dayId: targetDay.id,
				foodId: entry.foodId,
				recipeVersionId: entry.recipeVersionId,
				amount: entry.amount,
				mealType: entry.mealType,
				calories: entry.calories,
				protein: entry.protein,
				carbs: entry.carbs,
				fat: entry.fat,
				fiber: entry.fiber,
				sugar: entry.sugar,
				sodium: entry.sodium,
			}));

			await db.dayEntry.createMany({
				data: entriesToCreate,
			});
		}

		const updatedTargetDay = await db.day.findUnique({
			where: { id: targetDay.id },
			include: { entries: true },
		});

		return NextResponse.json(updatedTargetDay);
	} catch (error) {
		console.error('Error duplicating day:', error);
		return NextResponse.json({ error: 'Failed to duplicate day' }, { status: 500 });
	}
}
