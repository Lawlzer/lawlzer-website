import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: Request, { params }: { params: { recipeId: string } }) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { recipeId } = params;

		// Fetch the recipe to ensure user owns it
		const recipe = await db.recipe.findFirst({
			where: {
				id: recipeId,
				userId: session.user.id,
			},
		});

		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Fetch all versions with their items
		const versions = await db.recipeVersion.findMany({
			where: {
				recipeId,
			},
			include: {
				items: {
					include: {
						food: {
							select: {
								name: true,
							},
						},
						recipe: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			orderBy: {
				version: 'desc',
			},
		});

		return NextResponse.json(versions);
	} catch (error) {
		console.error('Error fetching recipe versions:', error);
		return NextResponse.json({ error: 'Failed to fetch recipe versions' }, { status: 500 });
	}
}
