import type { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

const exportedFoodSchema = z.object({
	name: z.string(),
	brand: z.string().nullable(),
	calories: z.number(),
	protein: z.number(),
	carbs: z.number(),
	fat: z.number(),
	fiber: z.number(),
	sugar: z.number(),
	sodium: z.number(),
});

const exportedRecipeSchema: z.ZodType = z.lazy(() =>
	z.object({
		name: z.string(),
		description: z.string().nullable(),
		notes: z.string().nullable(),
		prepTime: z.number().nullable(),
		cookTime: z.number().nullable(),
		servings: z.number(),
		visibility: z.enum(['private', 'unlisted', 'public']),
		isComponent: z.boolean(),
		items: z.array(
			z.object({
				amount: z.number(),
				unit: z.string(),
				food: exportedFoodSchema.optional(),
				recipe: exportedRecipeSchema.optional(),
			})
		),
	})
);

type ExportedRecipe = z.infer<typeof exportedRecipeSchema>;
type ExportedItem = ExportedRecipe['items'][number];

const importRecipe = async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$extends' | '$on' | '$transaction' | '$use'>, recipeData: ExportedRecipe, userId: string): Promise<string> => {
	const itemCreates = await Promise.all(
		recipeData.items.map(async (item: ExportedItem) => {
			let foodId: string | undefined;
			let nestedRecipeId: string | undefined;

			if (item.food) {
				const existingFood = await tx.food.findFirst({
					where: { name: item.food.name, brand: item.food.brand, userId },
				});
				if (existingFood) {
					foodId = existingFood.id;
				} else {
					const newFood = await tx.food.create({ data: { ...item.food, userId } });
					foodId = newFood.id;
				}
			} else if (item.recipe) {
				nestedRecipeId = await importRecipe(tx, item.recipe, userId);
			}

			return {
				amount: item.amount,
				unit: item.unit,
				foodId,
				recipeId: nestedRecipeId,
			};
		})
	);

	const newRecipe = await tx.recipe.create({
		data: {
			userId,
			name: recipeData.name,
			description: recipeData.description,
			notes: recipeData.notes,
			prepTime: recipeData.prepTime,
			cookTime: recipeData.cookTime,
			servings: recipeData.servings,
			visibility: recipeData.visibility,
			isComponent: recipeData.isComponent,
			versions: {
				create: {
					version: 1,
					name: recipeData.name,
					description: recipeData.description,
					notes: recipeData.notes,
					prepTime: recipeData.prepTime,
					cookTime: recipeData.cookTime,
					servings: recipeData.servings,
					caloriesPerServing: 0, // Simplified, would need calculation
					proteinPerServing: 0,
					carbsPerServing: 0,
					fatPerServing: 0,
					fiberPerServing: 0,
					sugarPerServing: 0,
					sodiumPerServing: 0,
					items: {
						create: itemCreates.map(({ foodId, recipeId, amount, unit }) => ({
							foodId,
							recipeId,
							amount,
							unit,
						})),
					},
				},
			},
		},
		include: { versions: true },
	});

	const finalRecipe = await tx.recipe.update({
		where: { id: newRecipe.id },
		data: { currentVersionId: newRecipe.versions[0].id },
	});

	return finalRecipe.id;
};

export async function POST(request: Request) {
	try {
		const session = await getSession();
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();
		const validation = exportedRecipeSchema.safeParse(data);

		if (!validation.success) {
			return NextResponse.json({ error: 'Invalid recipe format', details: validation.error.errors }, { status: 400 });
		}

		const recipeData = validation.data;

		const recipeId = await db.$transaction(async (tx) => importRecipe(tx, recipeData, session.user.id));

		const recipe = await db.recipe.findUnique({
			where: { id: recipeId },
			include: { currentVersion: { include: { items: true } } },
		});

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error importing recipe:', error);
		return NextResponse.json({ error: 'Failed to import recipe' }, { status: 500 });
	}
}
