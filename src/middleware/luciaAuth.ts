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
		// 1. Read session ID from cookie
		const sessionId = readSessionCookie(context.request.headers.get('cookie'));

		if (!sessionId) {
			return { user: null, session: null };
		}

		try {
			// 2. Validate session ID against the database
			const session = await validateSession(sessionId);

			if (!session) {
				// Session is invalid or expired, ensure cookie is cleared
				// Setting it here might conflict with other Set-Cookie headers
				// It's better handled in handlers or a dedicated response phase
				// context.headers['Set-Cookie'] = createBlankSessionCookie();
				return { user: null, session: null };
			}

			// 3. Fetch the associated user
			const user = await UserModel.findById(session.userId);

			if (!user) {
				// User associated with session not found (data inconsistency?)
				// Invalidate the session and clear cookie
				await invalidateSession(sessionId); // Use imported function
				// context.headers['Set-Cookie'] = createBlankSessionCookie();
				console.warn(`Session ${sessionId} had valid session but missing user ${session.userId}`);
				return { user: null, session: null };
			}

			// 4. Attach user and session to context
			return { user, session };
		} catch (error) {
			console.error('Error during session validation middleware:', error);
			return { user: null, session: null }; // Fail safe
		}
	});
};

// Re-export Session type if needed elsewhere, matching UserSession structure for compatibility
// Or adjust UserSession type definition in types.ts
export type UserSession = CustomAuthContext;
