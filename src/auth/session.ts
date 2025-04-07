import crypto from 'node:crypto';
import SessionModel, { ISession } from '../db/models/Session';
import { serialize, parse } from 'cookie';
import type { SerializeOptions } from 'cookie';

const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// --- Session Management ---

/**
 * Creates a new session for a user.
 * @param userId The ID of the user.
 * @returns The newly created session object.
 */
export const createSession = async (userId: string): Promise<ISession> => {
	const sessionId = crypto.randomBytes(32).toString('hex'); // Generate secure random session ID
	// Store expiration as Unix timestamp (milliseconds)
	const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;

	const session = new SessionModel({
		_id: sessionId,
		userId,
		expiresAt,
	});

	await session.save();
	return session;
};

/**
 * Validates a session ID.
 * @param sessionId The session ID to validate.
 * @returns The session object if valid and not expired, otherwise null.
 */
export const validateSession = async (sessionId: string): Promise<ISession | null> => {
	if (!sessionId) {
		return null;
	}
	const session = await SessionModel.findById(sessionId).exec();
	// Compare expiration timestamp with current time
	if (!session || session.expiresAt < Date.now()) {
		// If session exists but expired, delete it
		if (session) {
			await SessionModel.findByIdAndDelete(sessionId).exec();
		}
		return null;
	}
	return session;
};

/**
 * Deletes a session (logs out).
 * @param sessionId The ID of the session to delete.
 */
export const invalidateSession = async (sessionId: string): Promise<void> => {
	if (!sessionId) return;
	await SessionModel.findByIdAndDelete(sessionId).exec();
};

// --- Cookie Management ---

const getCookieOptions = (): SerializeOptions => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
	maxAge: SESSION_DURATION_SECONDS,
	sameSite: 'lax',
});

/**
 * Creates a session cookie string.
 * @param sessionId The session ID to store in the cookie.
 * @returns A string formatted for the Set-Cookie header.
 */
export const createSessionCookie = (sessionId: string): string => {
	return serialize(SESSION_COOKIE_NAME, sessionId, getCookieOptions());
};

/**
 * Creates a blank session cookie string (for logout).
 * @returns A string formatted for the Set-Cookie header to clear the session cookie.
 */
export const createBlankSessionCookie = (): string => {
	return serialize(SESSION_COOKIE_NAME, '', {
		...getCookieOptions(),
		maxAge: 0, // Expire immediately
	});
};

/**
 * Reads the session ID from the request cookies.
 * @param cookieHeader The value of the 'Cookie' header.
 * @returns The session ID if found, otherwise null.
 */
export const readSessionCookie = (cookieHeader: string | undefined | null): string | null => {
	if (!cookieHeader) return null;
	const cookies = parse(cookieHeader);
	return cookies[SESSION_COOKIE_NAME] || null;
};
