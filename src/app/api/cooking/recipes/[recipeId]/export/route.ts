import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

interface ExportedFood {
	name: string;
	brand: string | null;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
}

interface ExportedItem {
	amount: number;
	unit: string;
	food?: ExportedFood;
	recipe?: ExportedRecipe | null;
}

interface ExportedRecipe {
	name: string;
	description: string | null;
	notes: string | null;
	prepTime: number | null;
	cookTime: number | null;
	servings: number;
	visibility: string;
	isComponent: boolean;
	items: (ExportedItem | null)[];
}

// Helper function to recursively build recipe data
const buildRecipeExport = async (recipeId: string, userId: string | undefined): Promise<ExportedRecipe | null> => {
	const recipe = await db.recipe.findFirst({
		where: {
			id: recipeId,
			OR: [{ userId: userId }, { visibility: 'public' }],
		},
		include: {
			currentVersion: {
				include: {
					items: {
						include: {
							food: true,
							recipe: true, // Fetching the nested recipe shell
						},
					},
				},
			},
		},
	});

	if (!recipe || !recipe.currentVersion) {
		return null;
	}

	const items: (ExportedItem | null)[] = await Promise.all(
		recipe.currentVersion.items.map(async (item): Promise<ExportedItem | null> => {
			if (item.recipeId !== null && item.recipeId !== undefined) {
				const nestedRecipeData = await buildRecipeExport(item.recipeId, userId);
				return {
					amount: item.amount,
					unit: item.unit,
					recipe: nestedRecipeData, // Embed the full nested recipe
				};
			} else if (item.food) {
				return {
					amount: item.amount,
					unit: item.unit,
					food: {
						name: item.food.name,
						brand: item.food.brand,
						calories: item.food.calories,
						protein: item.food.protein,
						carbs: item.food.carbs,
						fat: item.food.fat,
						fiber: item.food.fiber,
						sugar: item.food.sugar,
						sodium: item.food.sodium,
					},
				};
			}
			return null;
		})
	);

	return {
		name: recipe.name,
		description: recipe.description,
		notes: recipe.notes,
		prepTime: recipe.prepTime,
		cookTime: recipe.cookTime,
		servings: recipe.servings,
		visibility: recipe.visibility,
		isComponent: recipe.isComponent,
		items: items.filter(Boolean), // Filter out any null items
	};
};

export async function GET(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
	try {
		const session = await getSession();
		const { recipeId } = await params;

		const exportData = await buildRecipeExport(recipeId, session?.user?.id);

		if (!exportData) {
			return NextResponse.json({ error: 'Recipe not found or you do not have permission' }, { status: 404 });
		}

		return new NextResponse(JSON.stringify(exportData, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${exportData.name}.json"`,
			},
		});
	} catch (error) {
		console.error(`Error exporting recipe:`, error);
		return NextResponse.json({ error: 'Failed to export recipe' }, { status: 500 });
	}
}
