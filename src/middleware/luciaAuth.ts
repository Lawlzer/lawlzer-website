import { Elysia, type Context } from 'elysia';
import { readSessionCookie, validateSession, createBlankSessionCookie, invalidateSession } from '../auth/session'; // Import custom session functions and invalidateSession
import UserModel, { IUser } from '../db/models/User';
import SessionModel, { ISession } from '../db/models/Session'; // Import Session model for type

// Define the shape of the context properties added by this middleware
// We are attaching the full Mongoose user document and session document
export interface CustomAuthContext {
	user: IUser | null;
	session: ISession | null;
}

export const customAuthMiddleware = () => (app: Elysia) => {
	// Let Elysia infer the return type for derive
	return app.derive(async (context: Context) => {
		console.log('[AuthMiddleware] Running...');
		// 1. Read session ID from cookie
		const cookieHeader = context.request.headers.get('cookie');
		const sessionId = readSessionCookie(cookieHeader);
		console.log(`[AuthMiddleware] Cookie Header: ${cookieHeader}`);
		console.log(`[AuthMiddleware] Session ID from cookie: ${sessionId}`);

		if (!sessionId) {
			console.log('[AuthMiddleware] No Session ID found. Returning { user: null, session: null }');
			return { user: null, session: null };
		}

		try {
			// 2. Validate session ID against the database
			console.log(`[AuthMiddleware] Validating session ID: ${sessionId}`);
			const session = await validateSession(sessionId);

			if (!session) {
				// Session is invalid or expired, ensure cookie is cleared
				// Setting it here might conflict with other Set-Cookie headers
				// It's better handled in handlers or a dedicated response phase
				// context.headers['Set-Cookie'] = createBlankSessionCookie();
				console.log(`[AuthMiddleware] Session ID ${sessionId} invalid or expired. Returning { user: null, session: null }`);
				return { user: null, session: null };
			}

			// Session found, log details
			console.log(`[AuthMiddleware] Session validated successfully:`, JSON.stringify(session));

			// 3. Fetch the associated user
			console.log(`[AuthMiddleware] Fetching user with ID: ${session.userId}`);
			const user = await UserModel.findById(session.userId);

			if (!user) {
				// User associated with session not found (data inconsistency?)
				// Invalidate the session and clear cookie
				console.warn(`[AuthMiddleware] User ${session.userId} for session ${sessionId} not found! Invalidating session.`);
				await invalidateSession(sessionId); // Use imported function
				// context.headers['Set-Cookie'] = createBlankSessionCookie();
				return { user: null, session: null };
			}

			// 4. Attach user and session to context
			console.log(`[AuthMiddleware] User found: ${user._id}. Attaching user and session to context.`);
			return { user, session };
		} catch (error) {
			console.error('[AuthMiddleware] Error during session validation middleware:', error);
			return { user: null, session: null }; // Fail safe
		}
	});
};

// Re-export Session type if needed elsewhere, matching UserSession structure for compatibility
// Or adjust UserSession type definition in types.ts
export type UserSession = CustomAuthContext;
