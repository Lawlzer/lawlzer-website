import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionDataByToken } from '~/server/db/session'; // Use the new function

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		// Read the session token from the request cookies
		const sessionToken = request.cookies.get('session_token')?.value;

		if (!sessionToken) {
			// No token, no session
			return NextResponse.json(null);
		}

		// Use the reusable function to get session data
		const sessionData = await getSessionDataByToken(sessionToken);

		if (!sessionData) {
			// Session not found, invalid, or expired
			// Optionally clear the cookie if it's invalid/expired
			const response = NextResponse.json(null);
			// Consider adding cookie clearing logic here if desired
			// response.cookies.set('session_token', '', { expires: new Date(0) });
			return response;
		}

		// Session is valid, return session data
		return NextResponse.json(sessionData);
	} catch (error) {
		console.error('Error fetching session:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
