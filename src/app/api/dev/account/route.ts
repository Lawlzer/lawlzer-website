import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '../../../../env.mjs';

import { getSessionDataByToken } from '~/server/db/session';

export async function GET(request: NextRequest): Promise<NextResponse> {
	if (env.NODE_ENV === 'development') {
		const sessionToken = request.cookies.get('session_token')?.value;
		const sessionData = await getSessionDataByToken(sessionToken ?? '');
		return NextResponse.json({ session: sessionData });
	}
	return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
}
