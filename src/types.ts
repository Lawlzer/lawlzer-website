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
