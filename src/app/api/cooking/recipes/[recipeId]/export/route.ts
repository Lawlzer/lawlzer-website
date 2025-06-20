import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: Request, { params }: { params: { recipeId: string } }) {
	try {
		const session = await getSession();
		const { recipeId } = params;

		const recipe = await db.recipe.findFirst({
			where: {
				id: recipeId,
				// Ensure user has access (is owner or recipe is public)
				OR: [{ userId: session?.user?.id }, { visibility: 'public' }],
			},
			include: {
				currentVersion: {
					include: {
						items: {
							include: {
								food: true,
								recipe: {
									include: {
										currentVersion: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Sanitize data for export (remove sensitive info)
		const exportData = {
			name: recipe.name,
			description: recipe.description,
			notes: recipe.notes,
			prepTime: recipe.prepTime,
			cookTime: recipe.cookTime,
			servings: recipe.servings,
			visibility: recipe.visibility,
			isComponent: recipe.isComponent,
			items: recipe.currentVersion?.items.map((item) => ({
				amount: item.amount,
				unit: item.unit,
				// Embed food data directly
				food: item.food
					? {
							name: item.food.name,
							brand: item.food.brand,
							calories: item.food.calories,
							protein: item.food.protein,
							carbs: item.food.carbs,
							fat: item.food.fat,
							// ... add other food fields as needed
						}
					: null,
				// Note: For now, we don't handle nested recipe exports deeply
				recipeName: item.recipe?.name,
			})),
		};

		return new NextResponse(JSON.stringify(exportData, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${recipe.name}.json"`,
			},
		});
	} catch (error) {
		console.error(`Error exporting recipe ${params.recipeId}:`, error);
		return NextResponse.json({ error: 'Failed to export recipe' }, { status: 500 });
	}
}
