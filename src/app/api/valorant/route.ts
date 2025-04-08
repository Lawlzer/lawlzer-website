import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
	return NextResponse.json({ message: 'This is the Valorant subdomain API' });
}
