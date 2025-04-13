import { NextResponse } from 'next/server';
import { getSession } from '~/server/db/session';

export async function GET(): Promise<NextResponse> {
	try {
		const session = await getSession();
		return NextResponse.json(session);
	} catch (error) {
		console.error('Error fetching session:', error);
		// Return null or an empty object in case of error,
		// rather than a 500 which might break the frontend.
		return NextResponse.json(null, { status: 500 });
	}
}
