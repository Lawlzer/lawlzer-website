import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function POST(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
	try {
		const session = await getSession();
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { recipeId } = await params;
		const { versionId } = await request.json();

		if (!versionId) {
			return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
		}

		const updatedRecipe = await db.$transaction(async (tx) => {
			const recipeToUpdate = await tx.recipe.findFirst({
				where: { id: recipeId, userId: session.user.id },
			});

			if (!recipeToUpdate) {
				throw new Error('Recipe not found or user does not have permission');
			}

			const versionToRevert = await tx.recipeVersion.findUnique({
				where: { id: versionId },
				include: { items: true },
			});

			if (!versionToRevert || versionToRevert.recipeId !== recipeId) {
				throw new Error('Version not found for this recipe');
			}

			const latestVersion = await tx.recipeVersion.findFirst({
				where: { recipeId },
				orderBy: { version: 'desc' },
			});

			const newVersionNumber = (latestVersion?.version ?? 0) + 1;

			const newVersion = await tx.recipeVersion.create({
				data: {
					recipeId: recipeId,
					version: newVersionNumber,
					name: versionToRevert.name,
					description: versionToRevert.description,
					notes: versionToRevert.notes,
					prepTime: versionToRevert.prepTime,
					cookTime: versionToRevert.cookTime,
					servings: versionToRevert.servings,
					caloriesPerServing: versionToRevert.caloriesPerServing,
					proteinPerServing: versionToRevert.proteinPerServing,
					carbsPerServing: versionToRevert.carbsPerServing,
					fatPerServing: versionToRevert.fatPerServing,
					fiberPerServing: versionToRevert.fiberPerServing,
					sugarPerServing: versionToRevert.sugarPerServing,
					sodiumPerServing: versionToRevert.sodiumPerServing,
					items: {
						create: versionToRevert.items.map((item) => ({
							foodId: item.foodId,
							recipeId: item.recipeId,
							amount: item.amount,
							unit: item.unit,
						})),
					},
				},
			});

			return tx.recipe.update({
				where: { id: recipeId },
				data: { currentVersionId: newVersion.id },
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
		});

		return NextResponse.json(updatedRecipe);
	} catch (error) {
		console.error('Error reverting recipe version:', error);
		const message = error instanceof Error ? error.message : 'Failed to revert recipe';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
