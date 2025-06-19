import type { User } from '@prisma/client';
import { cookies } from 'next/headers';

import { db } from '~/server/db';

export interface SessionData {
	user: User;
	expires: Date;
}

// New function to get session data based on the token
export async function getSessionDataByToken(sessionToken: string): Promise<SessionData | null> {
	if (!sessionToken) {
		return null;
	}

	const session = await db.session.findUnique({
		where: {
			sessionToken,
		},
		include: {
			user: true,
		},
	});

	if (!session) {
		return null;
	}

	if (new Date() > session.expires) {
		// Session expired, delete it
		await db.session.delete({
			where: {
				id: session.id,
			},
		});
		return null;
	}

	// Session is valid
	return {
		user: session.user,
		expires: session.expires,
	};
}

export async function getSession(): Promise<SessionData | null> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get('session_token')?.value;

	if (sessionToken === undefined || sessionToken === '') {
		return null;
	}

	// Call the new function to get session data
	return getSessionDataByToken(sessionToken);
}

export async function getUserFromSession(): Promise<User | null> {
	const session = await getSession();
	return session?.user ?? null;
}

export async function createSession(userId: string): Promise<{ sessionToken: string; userId: string; expires: Date }> {
	const sessionToken = crypto.randomUUID();

	const expires = new Date();
	expires.setDate(expires.getDate() + 7);

	return db.session.create({
		data: {
			sessionToken,
			userId,
			expires,
		},
	});
}

export async function destroySession(sessionToken: string): Promise<void> {
	await db.session.deleteMany({
		where: {
			sessionToken,
		},
	});
}
