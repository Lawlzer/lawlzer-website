/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		const { searchParams } = request.nextUrl;

		const query = searchParams.get('query') ?? '';
		const ingredients = searchParams.get('ingredients')?.split(',') ?? [];
		const maxPrepTime = searchParams.get('maxPrepTime');
		const sortBy = searchParams.get('sortBy') ?? 'createdAt'; // 'likes', 'createdAt', 'reports'
		const userId = session?.user?.id;

		// Mock admin check
		const isAdmin = userId === 'your_admin_user_id_here'; // Replace with actual admin ID

		let orderBy: any = { createdAt: 'desc' };
		if (sortBy === 'likes') {
			orderBy = { likes: { _count: 'desc' } };
		} else if (isAdmin && sortBy === 'reports') {
			orderBy = { reports: { _count: 'desc' } };
		}

		const recipes = await db.recipe.findMany({
			where: {
				AND: [
					// Visibility filter
					{
						OR: [...(session?.user?.id ? [{ userId: session.user.id }] : []), { visibility: 'public' }],
					},
					// Basic query filter (name, description)

					...(query
						? [
								{
									OR: [
										{ name: { contains: query, mode: 'insensitive' as const } },
										{
											description: { contains: query, mode: 'insensitive' as const },
										},
									],
								},
							]
						: []),
					// Ingredient filter
					...(ingredients.length > 0
						? [
								{
									currentVersion: {
										items: {
											some: {
												food: {
													name: { in: ingredients, mode: 'insensitive' as const },
												},
											},
										},
									},
								},
							]
						: []),
					// Prep time filter

					...(maxPrepTime
						? [
								{
									prepTime: {
										lte: parseInt(maxPrepTime),
									},
								},
							]
						: []),
					// Exclude components
					{ isComponent: false },
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
				user: {
					select: { name: true, image: true },
				},
				_count: {
					select: { likes: true, comments: true, reports: true },
				},
			},
			orderBy,
		});

		return NextResponse.json(recipes);
	} catch (error) {
		console.error('Error searching recipes:', error);
		return NextResponse.json({ error: 'Failed to search recipes' }, { status: 500 });
	}
}
