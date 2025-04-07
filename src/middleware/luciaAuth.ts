import { Elysia, type Context } from 'elysia';
import { readSessionCookie, validateSession, createBlankSessionCookie, invalidateSession } from '../auth/session'; // Import custom session functions and invalidateSession
import UserModel, { IUser } from '../db/models/User';
import SessionModel, { ISession } from '../db/models/Session'; // Import Session model for type
import { DEBUG_SESSION_STUFF } from '../config'; // Import

// Define the shape of the context properties added by this middleware
// We are attaching the full Mongoose user document and session document
export interface CustomAuthContext {
	user: IUser | null;
	session: ISession | null;
}

export const customAuthMiddleware = () => (app: Elysia) => {
	return app.derive(async (context: Context) => {
		console.log('[AuthMiddleware] Running...');
		const cookieHeader = context.request.headers.get('cookie');
		const sessionId = readSessionCookie(cookieHeader);

		if (DEBUG_SESSION_STUFF) {
			console.log(`[AuthMiddleware] Cookie Header: ${cookieHeader}`);
			console.log(`[AuthMiddleware] Session ID from cookie: ${sessionId}`);
		}

		if (!sessionId) {
			return { user: null, session: null };
		}

		try {
			if (DEBUG_SESSION_STUFF) {
				console.log(`[AuthMiddleware] Validating session ID: ${sessionId}`);
			}
			const session = await validateSession(sessionId);

			if (!session) {
				console.log(`[AuthMiddleware] Session ID ${sessionId} invalid or expired.`);
				return { user: null, session: null };
			}

			// Log successful validation only if debugging session stuff
			if (DEBUG_SESSION_STUFF) {
				console.log(`[AuthMiddleware] Session validated successfully:`, JSON.stringify(session));
			}

			const user = await UserModel.findById(session.userId);

			if (!user) {
				console.warn(`[AuthMiddleware] User ${session.userId} for session ${sessionId} not found! Invalidating session.`);
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
