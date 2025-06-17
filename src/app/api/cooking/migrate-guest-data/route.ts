import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();

		// Only allow logged-in users to migrate data
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const guestData = await request.json();

		// Validate guest data structure
		if (!guestData || typeof guestData !== 'object') {
			return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
		}

		const results = {
			foods: { migrated: 0, errors: 0 },
			recipes: { migrated: 0, errors: 0 },
			days: { migrated: 0, errors: 0 },
			goals: { migrated: 0, errors: 0 },
		};

		// Migrate foods
		if (Array.isArray(guestData.foods)) {
			for (const food of guestData.foods) {
				try {
					// Check if food with same barcode already exists for this user
					if (food.barcode) {
						const existing = await db.food.findFirst({
							where: {
								barcode: food.barcode,
								userId: session.user.id,
							},
						});

						if (existing) {
							console.info(`Food with barcode ${food.barcode} already exists for user, skipping`);
							continue;
						}
					}

					// Create the food entry
					await db.food.create({
						data: {
							userId: session.user.id,
							barcode: food.barcode,
							name: food.name,
							brand: food.brand,
							calories: food.calories || 0,
							protein: food.protein || 0,
							carbs: food.carbs || 0,
							fat: food.fat || 0,
							fiber: food.fiber || 0,
							sugar: food.sugar || 0,
							sodium: food.sodium || 0,
							saturatedFat: food.saturatedFat || 0,
							transFat: food.transFat || 0,
							cholesterol: food.cholesterol || 0,
							potassium: food.potassium || 0,
							vitaminA: food.vitaminA || 0,
							vitaminC: food.vitaminC || 0,
							calcium: food.calcium || 0,
							iron: food.iron || 0,
							imageUrl: food.imageUrl,
							defaultServingSize: food.defaultServingSize || 100,
							defaultServingUnit: food.defaultServingUnit || 'g',
							isPublic: false,
						},
					});

					results.foods.migrated++;
				} catch (error) {
					console.error('Error migrating food:', error);
					results.foods.errors++;
				}
			}
		}

		// TODO: Migrate recipes, days, and goals when implemented

		return NextResponse.json({
			success: true,
			results,
			message: `Successfully migrated ${results.foods.migrated} food(s)`,
		});
	} catch (error) {
		console.error('Error during guest data migration:', error);
		return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
	}
}
