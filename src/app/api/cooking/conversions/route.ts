import { NextResponse } from 'next/server';

import { getSession } from '~/server/db/session';

// Mock database for unit conversions
const mockConversionDB: any[] = [];

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const foodId = searchParams.get('foodId');
	// In a real implementation, you'd fetch conversions for a specific food
	// return NextResponse.json(await db.unitConversion.findMany({ where: { foodId } }));
	return NextResponse.json(mockConversionDB.filter((c) => c.foodId === foodId));
}

export async function POST(request: Request) {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { foodId, fromUnit, toUnit, factor } = await request.json();
	const newConversion = {
		id: crypto.randomUUID(),
		foodId,
		fromUnit,
		toUnit,
		factor,
		suggestedById: session.user.id,
		upvotes: 0,
		downvotes: 0,
	};
	mockConversionDB.push(newConversion);
	return NextResponse.json(newConversion);
}

export async function PUT(request: Request) {
	const session = await getSession();
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	const { conversionId, voteType } = await request.json();
	const conversion = mockConversionDB.find((c) => c.id === conversionId);
	if (conversion) {
		if (voteType === 'upvote') {
			conversion.upvotes++;
		} else {
			conversion.downvotes++;
		}
	}
	return NextResponse.json(conversion);
}
