import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		const { searchParams } = request.nextUrl;
		const search = searchParams.get('search');

		// Get recipes based on user
		const recipes = await db.recipe.findMany({
			where: {
				AND: [
					{
						OR: [...(session?.user?.id != null && session.user.id !== '' ? [{ userId: session.user.id }] : []), { isPublic: true }],
					},
					...(search != null && search !== ''
						? [
								{
									name: {
										contains: search,
										mode: 'insensitive' as const,
									},
								},
							]
						: []),
				],
			},
			include: {
				currentVersion: {
					include: {
						items: {
							include: {
								food: true,
								recipe: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(recipes);
	} catch (error) {
		console.error('Error fetching recipes:', error);
		return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();

		// Only allow logged-in users to create recipes for now
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Must be logged in to create recipes' }, { status: 401 });
		}

		const data = await request.json();

		// Validate required fields
		if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
			return NextResponse.json({ error: 'Recipe name is required' }, { status: 400 });
		}

		if (!Array.isArray(data.items) || data.items.length === 0) {
			return NextResponse.json({ error: 'Recipe must have at least one ingredient' }, { status: 400 });
		}

		// Start a transaction to create recipe and version atomically
		const recipe = await db.$transaction(async (tx) => {
			// Create the recipe
			const newRecipe = await tx.recipe.create({
				data: {
					userId: session.user.id,
					name: data.name.trim(),
					description: data.description?.trim(),
					notes: data.notes?.trim(),
					prepTime: data.prepTime ? parseInt(data.prepTime) : null,
					cookTime: data.cookTime ? parseInt(data.cookTime) : null,
					servings: data.servings ? parseInt(data.servings) : 1,
					isPublic: false,
					imageUrl: data.imageUrl,
				},
			});

			// Calculate nutrition totals
			let totalCalories = 0;
			let totalProtein = 0;
			let totalCarbs = 0;
			let totalFat = 0;
			let totalFiber = 0;
			let totalSugar = 0;
			let totalSodium = 0;

			// Process each ingredient
			for (const item of data.items) {
				if (item.foodId) {
					const food = await tx.food.findUnique({
						where: { id: item.foodId },
					});

					if (food) {
						// Calculate nutrition based on amount (assuming amount is in grams)
						const factor = (item.amount || 100) / 100;
						totalCalories += food.calories * factor;
						totalProtein += food.protein * factor;
						totalCarbs += food.carbs * factor;
						totalFat += food.fat * factor;
						totalFiber += food.fiber * factor;
						totalSugar += food.sugar * factor;
						totalSodium += food.sodium * factor;
					}
				}
				// TODO: Handle nested recipes when we implement that feature
			}

			// Calculate per-serving nutrition
			const servings = data.servings || 1;
			const caloriesPerServing = totalCalories / servings;
			const proteinPerServing = totalProtein / servings;
			const carbsPerServing = totalCarbs / servings;
			const fatPerServing = totalFat / servings;
			const fiberPerServing = totalFiber / servings;
			const sugarPerServing = totalSugar / servings;
			const sodiumPerServing = totalSodium / servings;

			// Create the first version
			const version = await tx.recipeVersion.create({
				data: {
					recipeId: newRecipe.id,
					version: 1,
					name: newRecipe.name,
					description: newRecipe.description,
					notes: newRecipe.notes,
					prepTime: newRecipe.prepTime,
					cookTime: newRecipe.cookTime,
					servings: newRecipe.servings,
					caloriesPerServing,
					proteinPerServing,
					carbsPerServing,
					fatPerServing,
					fiberPerServing,
					sugarPerServing,
					sodiumPerServing,
					items: {
						create: data.items.map((item: any) => ({
							foodId: item.foodId || null,
							recipeId: item.recipeId || null,
							amount: item.amount || 100,
							unit: item.unit || 'g',
						})),
					},
				},
			});

			// Update recipe with current version
			const updatedRecipe = await tx.recipe.update({
				where: { id: newRecipe.id },
				data: {
					currentVersionId: version.id,
				},
				include: {
					currentVersion: {
						include: {
							items: {
								include: {
									food: true,
									recipe: true,
								},
							},
						},
					},
				},
			});

			return updatedRecipe;
		});

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error creating recipe:', error);
		return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
	}
}
