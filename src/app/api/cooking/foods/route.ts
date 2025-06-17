import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		const { searchParams } = request.nextUrl;
		const barcode = searchParams.get('barcode');

		// Get foods based on user or barcode
		const foods = await db.food.findMany({
			where: {
				OR: [{ userId: session?.user?.id ?? null }, { isPublic: true }, ...(barcode != null ? [{ barcode }] : [])],
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
				imageUrl: data.imageUrl,
				defaultServingSize: data.servingSize ? parseFloat(data.servingSize) : 100,
			},
		});

		return NextResponse.json(food);
	} catch (error) {
		console.error('Error saving food:', error);
		return NextResponse.json({ error: 'Failed to save food' }, { status: 500 });
	}
}
