import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '../../../../server/auth';
import { env } from '../../../../env';

export async function GET(request: NextRequest): Promise<NextResponse> {
	if (env.NODE_ENV !== 'development') {
		return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
	}

	const session = await auth();

	return NextResponse.json({ session });
}
