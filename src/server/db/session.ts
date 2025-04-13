import { cookies } from 'next/headers';
import type { User } from '@prisma/client';
import { db } from '~/server/db';

export interface SessionData {
	user: User;
	expires: Date;
}

export async function getSession(): Promise<SessionData | null> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get('session_token')?.value;

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
		await db.session.delete({
			where: {
				id: session.id,
			},
		});
		return null;
	}

	return {
		user: session.user,
		expires: session.expires,
	};
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
