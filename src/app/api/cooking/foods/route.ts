/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		const { searchParams } = request.nextUrl;
		const barcode = searchParams.get('barcode');
		const search = searchParams.get('search');

		// Get foods based on user or public
		const foods = await db.food.findMany({
			where: {
				AND: [
					{
						OR: [{ userId: session?.user?.id ?? null }, { visibility: 'public' }],
					},

					...(barcode ? [{ barcode }] : []),
					...(search && search.trim() !== ''
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
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(foods);
	} catch (error) {
		console.error('Error fetching foods:', error);
		return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		const data = await request.json();

		// For guest users, we'll handle this later with cookies
		if (session?.user?.id == null || session.user.id === '') {
			return NextResponse.json({ error: 'Guest food saving coming soon' }, { status: 401 });
		}

		// Check if food with this barcode already exists for this user

		if (data.barcode) {
			const existingFood = await db.food.findFirst({
				where: {
					barcode: data.barcode,
					userId: session.user.id,
				},
			});

			if (existingFood) {
				return NextResponse.json({ error: 'Food already saved' }, { status: 409 });
			}
		}

		// Create new food
		const food = await db.food.create({
			data: {
				userId: session.user.id,
				barcode: data.barcode,
				name: data.name,
				brand: data.brand,
				calories: data.nutrition.calories,
				protein: data.nutrition.protein,
				carbs: data.nutrition.carbs,
				fat: data.nutrition.fat,
				fiber: data.nutrition.fiber,
				sugar: data.nutrition.sugar,
				sodium: data.nutrition.sodium,
				saturatedFat: data.nutrition.saturatedFat,
				transFat: data.nutrition.transFat,
				cholesterol: data.nutrition.cholesterol,
				defaultServingSize: data.defaultServingSize ?? 100,
				defaultServingUnit: data.defaultServingUnit ?? 'g',
				visibility: 'private',
				imageUrl: data.imageUrl,
			},
		});

		return NextResponse.json(food);
	} catch (error) {
		console.error('Error saving food:', error);
		return NextResponse.json({ error: 'Failed to save food' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await getSession();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = request.nextUrl;
		const foodId = searchParams.get('id');

		if (!foodId) {
			return NextResponse.json({ error: 'Food ID is required' }, { status: 400 });
		}

		// Check if the food exists and belongs to the user
		const food = await db.food.findFirst({
			where: {
				id: foodId,
				userId: session.user.id,
			},
		});

		if (!food) {
			return NextResponse.json({ error: 'Food not found or unauthorized' }, { status: 404 });
		}

		// Delete the food
		await db.food.delete({
			where: { id: foodId },
		});

		return NextResponse.json({ message: 'Food deleted successfully' });
	} catch (error) {
		console.error('Error deleting food:', error);
		return NextResponse.json({ error: 'Failed to delete food' }, { status: 500 });
	}
}
