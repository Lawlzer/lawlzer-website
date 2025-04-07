import type { Elysia } from 'elysia';
import type { Context } from 'elysia';
import { readSessionCookie, validateSession, createBlankSessionCookie, invalidateSession } from '../auth/session'; // Import custom session functions and invalidateSession
import UserModel from '../db/models/User';
import SessionModel from '../db/models/Session'; // Import Session model
import type { IUser } from '../db/models/User'; // Use import type
import type { ISession } from '../db/models/Session'; // Use import type
import { DEBUG_SESSION_STUFF } from '../config';

// Define the shape of the context properties added by this middleware
// We are attaching the full Mongoose user document and session document
export interface CustomAuthContext {
	user: IUser | null;
	session: ISession | null;
}

export const customAuthMiddleware = () => (app: Elysia) => {
	// Use import type for Context if only used as type
	return app.derive(async (context: Context) => {
		console.info('[AuthMiddleware] Running...'); // Use console.info
		const cookieHeader = context.request.headers.get('cookie');
		const sessionId = readSessionCookie(cookieHeader);

		if (DEBUG_SESSION_STUFF) {
			console.debug(`[AuthMiddleware] Cookie Header: ${cookieHeader}`); // Use debug
			console.debug(`[AuthMiddleware] Session ID from cookie: ${sessionId}`); // Use debug
		}

		if (!sessionId) {
			return { user: null, session: null };
		}

		try {
			if (DEBUG_SESSION_STUFF) {
				console.debug(`[AuthMiddleware] Validating session ID: ${sessionId}`); // Use debug
			}
			const session = await validateSession(sessionId);

			if (!session) {
				console.info(`[AuthMiddleware] Session ID ${sessionId} invalid or expired.`); // Use info
				return { user: null, session: null };
			}

			// Log successful validation only if debugging session stuff
			if (DEBUG_SESSION_STUFF) {
				console.debug(`[AuthMiddleware] Session validated successfully:`, JSON.stringify(session)); // Use debug
			}

			const user = await UserModel.findById(session.userId);

			if (!user) {
				// Explicitly convert ObjectId to string for logging
				console.warn(`[AuthMiddleware] User ${String(session.userId)} for session ${sessionId} not found! Invalidating session.`);
				await invalidateSession(sessionId);
				return { user: null, session: null };
			}

			return { user, session };
		} catch (error) {
			console.error('[AuthMiddleware] Error during session validation middleware:', error);
			return { user: null, session: null };
		}
	});
};

// Re-export Session type if needed elsewhere, matching UserSession structure for compatibility
// Or adjust UserSession type definition in types.ts
export type UserSession = CustomAuthContext;
