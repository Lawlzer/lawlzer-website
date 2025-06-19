import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function GET() {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get active goal for user
		const goal = await db.goal.findFirst({
			where: {
				userId: session.user.id,
				isActive: true,
			},
			orderBy: {
				startDate: 'desc',
			},
		});

		if (!goal) {
			// Return default goals if no active goal exists
			return NextResponse.json({
				calories: 2000,
				protein: 50,
				carbs: 250,
				fat: 65,
				fiber: 25,
				sugar: 50,
				sodium: 2300,
				isDefault: true,
			});
		}

		return NextResponse.json(goal);
	} catch (error) {
		console.error('Error fetching goal:', error);
		return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		// Validate required fields
		if (!body.calories || body.calories <= 0) {
			return NextResponse.json({ error: 'Invalid calorie goal' }, { status: 400 });
		}

		// Deactivate any existing active goals
		await db.goal.updateMany({
			where: {
				userId: session.user.id,
				isActive: true,
			},
			data: {
				isActive: false,
				endDate: new Date(),
			},
		});

		// Create new goal
		const goal = await db.goal.create({
			data: {
				userId: session.user.id,
				calories: body.calories,
				protein: body.protein || null,
				carbs: body.carbs || null,
				fat: body.fat || null,
				fiber: body.fiber || null,
				sugar: body.sugar || null,
				sodium: body.sodium || null,
				proteinPercentage: body.proteinPercentage || null,
				carbsPercentage: body.carbsPercentage || null,
				fatPercentage: body.fatPercentage || null,
				isActive: true,
				startDate: new Date(),
			},
		});

		return NextResponse.json(goal);
	} catch (error) {
		console.error('Error creating goal:', error);
		return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
	}
}

export async function PUT(request: Request) {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		// Get current active goal
		const currentGoal = await db.goal.findFirst({
			where: {
				userId: session.user.id,
				isActive: true,
			},
		});

		if (!currentGoal) {
			return NextResponse.json({ error: 'No active goal found' }, { status: 404 });
		}

		// Update the goal
		const updatedGoal = await db.goal.update({
			where: { id: currentGoal.id },
			data: {
				calories: body.calories || currentGoal.calories,
				protein: body.protein !== undefined ? body.protein : currentGoal.protein,
				carbs: body.carbs !== undefined ? body.carbs : currentGoal.carbs,
				fat: body.fat !== undefined ? body.fat : currentGoal.fat,
				fiber: body.fiber !== undefined ? body.fiber : currentGoal.fiber,
				sugar: body.sugar !== undefined ? body.sugar : currentGoal.sugar,
				sodium: body.sodium !== undefined ? body.sodium : currentGoal.sodium,
				proteinPercentage: body.proteinPercentage !== undefined ? body.proteinPercentage : currentGoal.proteinPercentage,
				carbsPercentage: body.carbsPercentage !== undefined ? body.carbsPercentage : currentGoal.carbsPercentage,
				fatPercentage: body.fatPercentage !== undefined ? body.fatPercentage : currentGoal.fatPercentage,
			},
		});

		return NextResponse.json(updatedGoal);
	} catch (error) {
		console.error('Error updating goal:', error);
		return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
	}
}
