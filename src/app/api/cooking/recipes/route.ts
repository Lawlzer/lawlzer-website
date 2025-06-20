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
						OR: [...(session?.user?.id ? [{ userId: session.user.id }] : []), { visibility: 'public' }],
					},
					{
						isComponent: false,
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
					visibility: data.visibility ?? 'private',
					isComponent: data.isComponent ?? false,
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

export async function PUT(request: NextRequest) {
	try {
		const session = await getSession();

		// Only allow logged-in users to update recipes
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Must be logged in to update recipes' }, { status: 401 });
		}

		const data = await request.json();

		// Validate required fields
		if (!data.id || typeof data.id !== 'string') {
			return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
		}

		if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
			return NextResponse.json({ error: 'Recipe name is required' }, { status: 400 });
		}

		if (!Array.isArray(data.items) || data.items.length === 0) {
			return NextResponse.json({ error: 'Recipe must have at least one ingredient' }, { status: 400 });
		}

		// Start a transaction to update recipe and create new version atomically
		const updatedRecipe = await db.$transaction(async (tx) => {
			// Verify the recipe exists and belongs to the user
			const existingRecipe = await tx.recipe.findFirst({
				where: {
					id: data.id,
					userId: session.user.id,
				},
				include: {
					versions: {
						orderBy: { version: 'desc' },
						take: 1,
					},
				},
			});

			if (!existingRecipe) {
				throw new Error('Recipe not found or you do not have permission to edit it');
			}

			// Get the latest version number
			const latestVersion = existingRecipe.versions[0]?.version ?? 0;
			const newVersionNumber = latestVersion + 1;

			// Update the recipe metadata
			const recipe = await tx.recipe.update({
				where: { id: data.id },
				data: {
					name: data.name.trim(),
					description: data.description?.trim(),
					notes: data.notes?.trim(),
					prepTime: data.prepTime ? parseInt(data.prepTime) : null,
					cookTime: data.cookTime ? parseInt(data.cookTime) : null,
					servings: data.servings ? parseInt(data.servings) : 1,
					visibility: data.visibility,
					isComponent: data.isComponent,
					imageUrl: data.imageUrl,
					updatedAt: new Date(),
				},
			});

			// Calculate nutrition totals for the new version
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
				} else if (item.recipeId) {
					// Handle nested recipes
					const nestedRecipe = await tx.recipe.findUnique({
						where: { id: item.recipeId },
						include: {
							currentVersion: true,
						},
					});

					if (nestedRecipe?.currentVersion) {
						const factor = (item.amount || 100) / 100;
						const servingFactor = factor / nestedRecipe.servings;

						totalCalories += nestedRecipe.currentVersion.caloriesPerServing * nestedRecipe.servings * servingFactor;
						totalProtein += nestedRecipe.currentVersion.proteinPerServing * nestedRecipe.servings * servingFactor;
						totalCarbs += nestedRecipe.currentVersion.carbsPerServing * nestedRecipe.servings * servingFactor;
						totalFat += nestedRecipe.currentVersion.fatPerServing * nestedRecipe.servings * servingFactor;
						totalFiber += nestedRecipe.currentVersion.fiberPerServing * nestedRecipe.servings * servingFactor;
						totalSugar += nestedRecipe.currentVersion.sugarPerServing * nestedRecipe.servings * servingFactor;
						totalSodium += nestedRecipe.currentVersion.sodiumPerServing * nestedRecipe.servings * servingFactor;
					}
				}
			}

			// Calculate per-serving nutrition
			const { servings } = recipe;
			const caloriesPerServing = totalCalories / servings;
			const proteinPerServing = totalProtein / servings;
			const carbsPerServing = totalCarbs / servings;
			const fatPerServing = totalFat / servings;
			const fiberPerServing = totalFiber / servings;
			const sugarPerServing = totalSugar / servings;
			const sodiumPerServing = totalSodium / servings;

			// Create a new version (NOT modifying the existing one)
			const newVersion = await tx.recipeVersion.create({
				data: {
					recipeId: recipe.id,
					version: newVersionNumber,
					name: recipe.name,
					description: recipe.description,
					notes: recipe.notes,
					prepTime: recipe.prepTime,
					cookTime: recipe.cookTime,
					servings: recipe.servings,
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

			// Update recipe to point to the new current version
			const finalRecipe = await tx.recipe.update({
				where: { id: recipe.id },
				data: {
					currentVersionId: newVersion.id,
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
					versions: {
						orderBy: { version: 'desc' },
					},
				},
			});

			return finalRecipe;
		});

		return NextResponse.json(updatedRecipe);
	} catch (error) {
		console.error('Error updating recipe:', error);
		return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update recipe' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await getSession();

		// Only allow logged-in users to delete recipes
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Must be logged in to delete recipes' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const recipeId = searchParams.get('id');

		if (recipeId == null || recipeId === '') {
			return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
		}

		// Check if the recipe exists and belongs to the user
		const recipe = await db.recipe.findFirst({
			where: {
				id: recipeId,
				userId: session.user.id,
			},
		});

		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found or you do not have permission to delete it' }, { status: 404 });
		}

		// Delete the recipe (cascading deletes will handle versions and items)
		await db.recipe.delete({
			where: {
				id: recipeId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting recipe:', error);
		return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
	}
}
