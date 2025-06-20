import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

const recipeItemSchema = z.object({
	amount: z.number(),
	unit: z.string(),
	food: z
		.object({
			name: z.string(),
			brand: z.string().nullable(),
			calories: z.number(),
			protein: z.number(),
			carbs: z.number(),
			fat: z.number(),
		})
		.nullable(),
	recipeName: z.string().nullable(),
});

const recipeImportSchema = z.object({
	name: z.string(),
	description: z.string().nullable(),
	notes: z.string().nullable(),
	prepTime: z.number().nullable(),
	cookTime: z.number().nullable(),
	servings: z.number(),
	visibility: z.enum(['private', 'unlisted', 'public']),
	isComponent: z.boolean(),
	items: z.array(recipeItemSchema),
});

export async function POST(request: Request) {
	try {
		const session = await getSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();
		const validation = recipeImportSchema.safeParse(data);

		if (!validation.success) {
			return NextResponse.json({ error: 'Invalid recipe format', details: validation.error.errors }, { status: 400 });
		}

		const recipeData = validation.data;

		// This is a simplified import. It finds foods by name/brand or creates them.
		// It does not handle nested recipe imports yet.
		const recipe = await db.$transaction(async (tx) => {
			const itemCreates = await Promise.all(
				recipeData.items.map(async (item) => {
					let foodId: string | undefined = undefined;
					if (item.food) {
						const existingFood = await tx.food.findFirst({
							where: {
								name: item.food.name,
								brand: item.food.brand,
								userId: session.user.id, // Only check user's own foods
							},
						});

						if (existingFood) {
							foodId = existingFood.id;
						} else {
							// Create new food if it doesn't exist
							const newFood = await tx.food.create({
								data: {
									...item.food,
									userId: session.user.id,
									visibility: 'private',
								},
							});
							foodId = newFood.id;
						}
					}
					return {
						amount: item.amount,
						unit: item.unit,
						foodId: foodId,
					};
				})
			);

			const newRecipe = await tx.recipe.create({
				data: {
					userId: session.user.id,
					name: recipeData.name,
					description: recipeData.description,
					notes: recipeData.notes,
					prepTime: recipeData.prepTime,
					cookTime: recipeData.cookTime,
					servings: recipeData.servings,
					visibility: recipeData.visibility,
					isComponent: recipeData.isComponent,
					// Create version and items in a single step
					versions: {
						create: {
							version: 1,
							name: recipeData.name,
							description: recipeData.description,
							notes: recipeData.notes,
							prepTime: recipeData.prepTime,
							cookTime: recipeData.cookTime,
							servings: recipeData.servings,
							// Simplified nutrition calculation - would be more complex in reality
							caloriesPerServing: 0,
							proteinPerServing: 0,
							carbsPerServing: 0,
							fatPerServing: 0,
							fiberPerServing: 0,
							sugarPerServing: 0,
							sodiumPerServing: 0,
							items: {
								create: itemCreates,
							},
						},
					},
				},
				include: { versions: true },
			});

			// Update the recipe with the current version ID
			return tx.recipe.update({
				where: { id: newRecipe.id },
				data: { currentVersionId: newRecipe.versions[0].id },
			});
		});

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error importing recipe:', error);
		return NextResponse.json({ error: 'Failed to import recipe' }, { status: 500 });
	}
}
