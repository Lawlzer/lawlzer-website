import type { ISession } from './db/models/Session';
import type { IUser } from './db/models/User';

// Configuration for displaying URLs
export interface UrlConfig {
	home: string; // Full URL for nav
	valorant: string; // Full URL for nav
	overwatch: string; // Full URL for nav
}

// Define the possible subdomain values explicitly
export type Subdomain = 'base' | 'valorant' | 'overwatch' | 'unknown';

// Extend Elysia's Context type if needed, or define context structure if handlers need it
// For now, the handlers only need navUrls, passed directly.
// import { Context as ElysiaContext } from 'elysia';
// export interface AppContext extends ElysiaContext {
//     store: { // Example if using store
//         // ...
//     };
//     derive: { // Example if using derive
//         subdomain: Subdomain;
//     };
//     // Add other properties like set, query, params, body as needed
//     set: ElysiaContext['set'];
// }

// Define the structure of the user object provided by Lucia middleware
export interface UserSession {
	user: IUser | null; // Use the full Mongoose IUser type
	session: ISession | null;
}

// --- Application Context Type ---
import { Context as ElysiaContext } from 'elysia';
// import { Html } from '@elysiajs/html'; // Import removed temporarily

// Combine all expected properties into a single AppContext type
export type AppContext = ElysiaContext & // Base Elysia context (req, set, path, query, params, body, cookie, etc.)
	UserSession & {
		// From customAuthMiddleware (user, session)
		derive: {
			// Properties added by .derive()
			subdomain: Subdomain;
			navUrls: UrlConfig;
		};
		decorator: {
			// Properties added by plugins like .use(html())
			html: Function; // Use generic Function type for now
		};
		store: {}; // Define if using store
		// Ensure standard properties are explicitly available if needed beyond base Context
		// set: ElysiaContext['set'];
		// request: ElysiaContext['request'];
		// path: ElysiaContext['path'];
		// query: ElysiaContext['query'];
		// params: ElysiaContext['params'];
		// body: ElysiaContext['body'];
		// cookie: ElysiaContext['cookie'];
	};
