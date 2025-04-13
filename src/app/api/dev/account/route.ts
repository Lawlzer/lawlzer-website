import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '../../../../env.mjs';
import { getSession } from '~/server/db/session';

export async function GET(): Promise<NextResponse> {
	if (env.NODE_ENV === 'development') {
		const session = await getSession();
		return NextResponse.json({ session });
	}
	return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
}
