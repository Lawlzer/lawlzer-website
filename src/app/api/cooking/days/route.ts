import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

// Schema for creating/updating a day entry
const DaySchema = z.object({
	date: z.string(), // ISO date string
	entries: z
		.array(
			z.object({
				foodId: z.string().optional(),
				recipeVersionId: z.string().optional(),
				amount: z.number().min(0),
				mealType: z.string().optional(),
			})
		)
		.optional(),
	goals: z
		.object({
			targetCalories: z.number().min(0).optional(),
			targetProtein: z.number().min(0).optional(),
			targetCarbs: z.number().min(0).optional(),
			targetFat: z.number().min(0).optional(),
			targetFiber: z.number().min(0).optional(),
		})
		.optional(),
	notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		if (session?.user?.id === null || session?.user?.id === undefined || session?.user?.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = request.nextUrl;
		const date = searchParams.get('date');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		// Get a single day
		if (date !== null && date !== '') {
			const day = await db.day.findUnique({
				where: {
					userId_date: {
						userId: session.user.id,
						date: new Date(date),
					},
				},
				include: {
					entries: {
						include: {
							food: true,
							recipeVersion: {
								include: {
									recipe: true,
								},
							},
						},
					},
				},
			});

			return NextResponse.json({ day });
		}

		// Get multiple days in a range
		if (startDate !== null && startDate !== '' && endDate !== null && endDate !== '') {
			const days = await db.day.findMany({
				where: {
					userId: session.user.id,
					date: {
						gte: new Date(startDate),
						lte: new Date(endDate),
					},
				},
				include: {
					entries: {
						include: {
							food: true,
							recipeVersion: {
								include: {
									recipe: true,
								},
							},
						},
					},
				},
				orderBy: {
					date: 'desc',
				},
			});

			return NextResponse.json({ days });
		}

		// Get recent days (last 7 days by default)
		const days = await db.day.findMany({
			where: {
				userId: session.user.id,
			},
			include: {
				entries: {
					include: {
						food: true,
						recipeVersion: {
							include: {
								recipe: true,
							},
						},
					},
				},
			},
			orderBy: {
				date: 'desc',
			},
			take: 7,
		});

		return NextResponse.json({ days });
	} catch (error) {
		console.error('Error fetching days:', error);
		return NextResponse.json({ error: 'Failed to fetch days' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (session?.user?.id === null || session?.user?.id === undefined || session?.user?.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const parsed = DaySchema.parse(body);

		const dayDate = new Date(parsed.date);
		dayDate.setUTCHours(0, 0, 0, 0); // Ensure it's just the date, no time

		// Create or update the day
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
				targetCalories: parsed.goals?.targetCalories,
				targetProtein: parsed.goals?.targetProtein,
				targetCarbs: parsed.goals?.targetCarbs,
				targetFat: parsed.goals?.targetFat,
				targetFiber: parsed.goals?.targetFiber,
				notes: parsed.notes,
			},
			update: {
				targetCalories: parsed.goals?.targetCalories,
				targetProtein: parsed.goals?.targetProtein,
				targetCarbs: parsed.goals?.targetCarbs,
				targetFat: parsed.goals?.targetFat,
				targetFiber: parsed.goals?.targetFiber,
				notes: parsed.notes,
			},
		});

		// Update entries if provided
		if (parsed.entries) {
			// Remove existing entries
			await db.dayEntry.deleteMany({
				where: {
					dayId: day.id,
				},
			});

			// Add new entries
			for (const entry of parsed.entries) {
				if ((entry.foodId === null || entry.foodId === undefined || entry.foodId === '') && (entry.recipeVersionId === null || entry.recipeVersionId === undefined || entry.recipeVersionId === '')) {
					continue; // Skip invalid entries
				}

				// Get nutrition info for the entry
				let nutrition = {
					calories: 0,
					protein: 0,
					carbs: 0,
					fat: 0,
					fiber: 0,
					sugar: 0,
					sodium: 0,
				};

				if (entry.foodId !== null && entry.foodId !== undefined && entry.foodId !== '') {
					const food = await db.food.findUnique({
						where: { id: entry.foodId },
					});
					if (food) {
						const ratio = entry.amount / 100; // Food nutrition is per 100g
						nutrition = {
							calories: food.calories * ratio,
							protein: food.protein * ratio,
							carbs: food.carbs * ratio,
							fat: food.fat * ratio,
							fiber: food.fiber * ratio,
							sugar: food.sugar * ratio,
							sodium: food.sodium * ratio,
						};
					}
				} else if (entry.recipeVersionId !== null && entry.recipeVersionId !== undefined && entry.recipeVersionId !== '') {
					const recipeVersion = await db.recipeVersion.findUnique({
						where: { id: entry.recipeVersionId },
					});
					if (recipeVersion) {
						const ratio = entry.amount / recipeVersion.servings;
						nutrition = {
							calories: recipeVersion.caloriesPerServing * ratio,
							protein: recipeVersion.proteinPerServing * ratio,
							carbs: recipeVersion.carbsPerServing * ratio,
							fat: recipeVersion.fatPerServing * ratio,
							fiber: recipeVersion.fiberPerServing * ratio,
							sugar: recipeVersion.sugarPerServing * ratio,
							sodium: recipeVersion.sodiumPerServing * ratio,
						};
					}
				}

				await db.dayEntry.create({
					data: {
						dayId: day.id,
						foodId: entry.foodId,
						recipeVersionId: entry.recipeVersionId,
						amount: entry.amount,
						mealType: entry.mealType,
						...nutrition,
					},
				});
			}
		}

		// Return the updated day with all entries
		const updatedDay = await db.day.findUnique({
			where: { id: day.id },
			include: {
				entries: {
					include: {
						food: true,
						recipeVersion: {
							include: {
								recipe: true,
							},
						},
					},
				},
			},
		});

		return NextResponse.json({ day: updatedDay });
	} catch (error) {
		console.error('Error saving day:', error);
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
		}
		return NextResponse.json({ error: 'Failed to save day' }, { status: 500 });
	}
}
