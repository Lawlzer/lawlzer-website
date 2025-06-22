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

		const body = await request.json();
		const guestData = body.guestData !== undefined ? body.guestData : body; // Handle both wrapped and unwrapped formats

		// Validate guest data structure
		if (!guestData || typeof guestData !== 'object') {
			return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
		}

		// Validate required properties
		const hasValidStructure = (guestData.foods === undefined || Array.isArray(guestData.foods)) && (guestData.recipes === undefined || Array.isArray(guestData.recipes)) && (guestData.days === undefined || Array.isArray(guestData.days));

		if (!hasValidStructure) {
			return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
		}

		let migratedRecipes = 0;
		let migratedFoods = 0;
		let migratedEntries = 0;
		let goalsUpdated = false;

		// Use a transaction to ensure all or nothing is migrated
		await db.$transaction(async (tx) => {
			const guestFoodIdToDbId = new Map<string, string>();
			const guestRecipeIdToDbVersionId = new Map<string, string>();

			// --- 1. Migrate Foods ---
			if (Array.isArray(guestData.foods)) {
				for (const food of guestData.foods) {
					try {
						// Handle both id and guestId fields
						const foodGuestId = food.guestId || food.id;

						// Skip invalid foods
						if (food.name === undefined || food.name === '' || foodGuestId === undefined || foodGuestId === '') continue;

						// De-duplication logic
						if (food.barcode) {
							const existing = await tx.food.findFirst({
								where: { barcode: food.barcode, userId: session.user.id },
							});
							if (existing) {
								guestFoodIdToDbId.set(foodGuestId, existing.id);
								continue;
							}
						}
						const newFood = await tx.food.create({
							data: {
								userId: session.user.id,
								name: food.name,
								brand: food.brand,
								barcode: food.barcode,
								calories: food.calories || 0,
								protein: food.protein || 0,
								carbs: food.carbs || 0,
								fat: food.fat || 0,
								fiber: food.fiber || 0,
								sugar: food.sugar || 0,
								sodium: food.sodium || 0,
								visibility: 'private',
							},
						});
						guestFoodIdToDbId.set(foodGuestId, newFood.id);
						migratedFoods++;
					} catch (error) {
						console.error('Error migrating food:', error);
					}
				}
			}

			// --- 2. Migrate Recipes ---
			if (Array.isArray(guestData.recipes)) {
				for (const recipe of guestData.recipes) {
					try {
						// Handle both id and guestId fields
						const recipeGuestId = recipe.guestId || recipe.id;

						// Skip invalid recipes
						const items = recipe.items || recipe.ingredients || [];
						if (recipe.name === undefined || recipe.name === '' || recipeGuestId === undefined || recipeGuestId === '') continue;

						// Convert ingredients format if needed
						const itemCreates = Array.isArray(items)
							? items.map((item: any) => {
									if (typeof item === 'string') {
										// Simple string ingredients, create basic items
										return { amount: 1, unit: 'serving' };
									}
									const foodId = item.foodId ? guestFoodIdToDbId.get(item.foodId) : null;
									return {
										amount: item.amount || 1,
										unit: item.unit || 'serving',
										foodId,
									};
								})
							: [];

						const newRecipe = await tx.recipe.create({
							data: {
								userId: session.user.id,
								name: recipe.name,
								description: recipe.description,
								notes: recipe.notes || recipe.instructions?.join('\n'),
								prepTime: recipe.prepTime || 0,
								cookTime: recipe.cookTime || 0,
								servings: recipe.servings || 1,
								visibility: recipe.visibility || 'private',
								isComponent: false,
								versions: {
									create: {
										version: 1,
										name: recipe.name,
										description: recipe.description,
										notes: recipe.notes || recipe.instructions?.join('\n'),
										prepTime: recipe.prepTime || 0,
										cookTime: recipe.cookTime || 0,
										servings: recipe.servings || 1,
										caloriesPerServing: 0, // Simplified, would need calculation
										proteinPerServing: 0,
										carbsPerServing: 0,
										fatPerServing: 0,
										fiberPerServing: 0,
										sugarPerServing: 0,
										sodiumPerServing: 0,
										items: { create: itemCreates },
									},
								},
							},
							include: { versions: true },
						});
						const newVersion = newRecipe.versions[0];
						await tx.recipe.update({
							where: { id: newRecipe.id },
							data: { currentVersionId: newVersion.id },
						});
						guestRecipeIdToDbVersionId.set(recipeGuestId, newVersion.id);
						migratedRecipes++;
					} catch (error) {
						console.error('Error migrating recipe:', error);
					}
				}
			}

			// --- 3. Migrate Goals ---
			if (guestData.goals && Object.keys(guestData.goals).length > 0) {
				try {
					const existingGoal = await tx.goal.findFirst({
						where: { userId: session.user.id, isActive: true },
					});
					if (!existingGoal) {
						await tx.goal.create({
							data: {
								userId: session.user.id,
								calories: guestData.goals.calories || 2000,
								protein: guestData.goals.protein || 50,
								carbs: guestData.goals.carbs || 250,
								fat: guestData.goals.fat || 65,
								fiber: guestData.goals.fiber || 25,
								sugar: guestData.goals.sugar || 50,
								sodium: guestData.goals.sodium || 2300,
								proteinPercentage: guestData.goals.proteinPercentage || 20,
								carbsPercentage: guestData.goals.carbsPercentage || 50,
								fatPercentage: guestData.goals.fatPercentage || 30,
							},
						});
						goalsUpdated = true;
					}
				} catch (error) {
					console.error('Error migrating goal:', error);
				}
			}

			// --- 4. Migrate Days ---
			if (Array.isArray(guestData.days)) {
				for (const day of guestData.days) {
					try {
						const newDay = await tx.day.create({
							data: {
								userId: session.user.id,
								date: new Date(day.date),
								targetCalories: day.targetCalories,
								targetProtein: day.targetProtein,
								targetCarbs: day.targetCarbs,
								targetFat: day.targetFat,
								targetFiber: day.targetFiber,
							},
						});

						if (Array.isArray(day.entries)) {
							for (const entry of day.entries) {
								const foodId = entry.foodId ? guestFoodIdToDbId.get(entry.foodId) : null;
								const recipeVersionId = entry.recipeId ? guestRecipeIdToDbVersionId.get(entry.recipeId) : null;

								if (foodId !== null || recipeVersionId !== null) {
									await tx.dayEntry.create({
										data: {
											dayId: newDay.id,
											foodId,
											recipeVersionId,
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
									migratedEntries++;
								}
							}
						}
					} catch (error) {
						console.error('Error migrating day:', error);
					}
				}
			}
		});

		return NextResponse.json({
			success: true,
			migrated: {
				recipes: migratedRecipes,
				foods: migratedFoods,
				entries: migratedEntries,
				goalsUpdated,
			},
			message: `Successfully migrated ${migratedFoods} food(s) and ${migratedRecipes} recipe(s)`,
		});
	} catch (error) {
		console.error('Error during guest data migration:', error);
		return NextResponse.json({ error: 'Failed to migrate guest data' }, { status: 500 });
	}
}
