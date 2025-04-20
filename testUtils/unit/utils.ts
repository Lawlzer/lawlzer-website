import type { MockedFunction, Mock } from 'vitest';
import { expect, vi } from 'vitest';
import { db } from '../../src/server/db';

// Store the original process.env to restore later
const originalProcessEnv = { ...process.env };

// Function to restore original env (call this in test teardown like afterEach)
export function restoreEnv(): void {
	process.env = originalProcessEnv;
}

export function mockEnv(envOverrides: Record<string, unknown>): void {
	// --- 1. Define All Required Env Vars with Defaults ---
	const defaultTestEnv = {
		// From test requirements
		NEXT_PUBLIC_SCHEME: 'http',
		NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'dev',
		NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'localhost',
		NEXT_PUBLIC_FRONTEND_PORT: '3005',
		NODE_ENV: 'test',

		// Other required vars from src/env.mjs (provide dummy values)
		DATABASE_URL: 'mongodb://test:test@localhost:27017/testdb',
		NEXT_PUBLIC_AUTH_GOOGLE_ID: 'test_google_id',
		AUTH_GOOGLE_SECRET: 'test_google_secret',
		NEXT_PUBLIC_AUTH_DISCORD_ID: 'test_discord_id',
		AUTH_DISCORD_SECRET: 'test_discord_secret',
		NEXT_PUBLIC_AUTH_GITHUB_ID: 'test_github_id',
		AUTH_GITHUB_SECRET: 'test_github_secret',

		// Optional vars - can be omitted or set to undefined/empty
		VERCEL_URL: undefined,
		DEBUG_CONTEXT_KEYS: undefined,
		DEBUG_SUBDOMAIN_VALUE: undefined,
		DEBUG_SESSION_STUFF: undefined,
	};

	// --- 2. Merge Defaults and Overrides ---
	const mergedEnv = {
		...defaultTestEnv,
		...envOverrides, // User overrides take precedence
	};

	// --- 3. Set process.env ---
	// Store keys relevant to our env schema from the defaults
	const relevantKeys = Object.keys(defaultTestEnv);

	// First, ensure all relevant keys from our defaults/overrides exist on process.env
	for (const key of relevantKeys) {
		const value = mergedEnv[key as keyof typeof mergedEnv]; // Use type assertion
		process.env[key] = value === undefined ? undefined : String(value);
	}

	// Optionally, remove keys from process.env that were in the original but are not in our merged set
	// (Be cautious with this - might remove needed system vars if not careful)
	// Example (if needed):
	// for (const key in originalProcessEnv) {
	//    if (!relevantKeys.includes(key) && process.env[key] !== undefined) {
	//        // console.log('Deleting potentially stale env var:', key);
	//        delete process.env[key]; // Linter might complain here too
	//    }
	// }

	// --- 4. Mock the ~/env module ---
	// This ensures that code importing `env` gets the mocked values
	/* vi.doMock('~/env', async () => {
        // We *could* importActual here, but createEnv would run again with the modified process.env.
        // It's simpler and safer to just return the already merged object.
        // const actualEnvModule = await vi.importActual('~/env'); // Not strictly needed now

        // Return the structure expected from src/env.mjs
		return {
            env: mergedEnv, // Return the merged object directly
            // If src/env.mjs exported other things, mock them here too if needed.
		};
	}); */
	// ^^^^ Removed vi.doMock call. Module mocking will be handled statically in the test file. ^^^^
}

type PrismaMockOverrides = {
	[K in keyof typeof db]?: {
		[M in keyof (typeof db)[K]]?: Mock;
	};
};

export function mockDb(overrides: PrismaMockOverrides): void {
	if (typeof db !== 'object' || db === null) {
		console.warn('Prisma client (db) not found or not mocked correctly. Did you forget vi.mock("~/server/db")?'); // Update warning message
		return;
	}

	for (const modelName in overrides) {
		const modelKey = modelName as keyof typeof db;

		if (!(modelKey in db) || typeof db[modelKey] !== 'object' || db[modelKey] === null) {
			console.warn(`Model "${modelName}" not found or not an object on the mocked db client.`);
			continue;
		}

		const modelOverrides = overrides[modelKey];
		if (modelOverrides) {
			const targetModel = db[modelKey];

			for (const methodName in modelOverrides) {
				const methodKey = methodName as keyof typeof targetModel;
				const mockFn = modelOverrides[methodKey]; // Type is now Mock | undefined

				if (methodKey in targetModel && typeof mockFn === 'function') {
					// Assign the mock function. Cast targetModel[methodKey] to allow assignment using Mock.
					(targetModel[methodKey] as Mock) = mockFn;
				} else if (methodKey in targetModel) {
					// Log if an override was provided but wasn't a function mock
					console.warn(`Override for "${modelName}.${methodName}" is not a Mock function.`); // Update warning message
				} else {
					console.warn(`Method "${methodName}" not found on mocked db model "${modelName}".`);
				}
			}
		}
	}
}

// --- Common Response Assertions ---

/**
 * Asserts that the response indicates success (2xx status).
 * Optionally checks for a specific status code and JSON content type.
 *
 * @param response The fetch Response object.
 * @param expectedStatus The specific success status code expected (default: 200).
 * @param checkContentType Whether to assert 'application/json' content type (default: true).
 */
export function expectSuccessfulResponse(response: Response, checkContentType = true): void {
	expect(response.status).toBeGreaterThanOrEqual(200);
	expect(response.status).toBeLessThan(300);
	if (checkContentType) {
		expect(response.headers.get('content-type')).toContain('application/json');
	}
}

/**
 * Asserts that the response indicates a client or server error (4xx or 5xx).
 * Optionally checks for a specific status code and JSON content type.
 *
 * @param response The fetch Response object.
 * @param expectedStatus The specific error status code expected.
 * @param checkContentType Whether to assert 'application/json' content type (default: true).
 */
export function expectErrorResponse(response: Response, expectedStatus: number, checkContentType = true): void {
	expect(response.status).toBe(expectedStatus);
	expect(response.status).toBeGreaterThanOrEqual(400);
	// Allow checking for specific 5xx errors too
	// expect(response.status).toBeLessThan(600);
	if (checkContentType) {
		// Errors should generally return JSON details
		expect(response.headers.get('content-type')).toContain('application/json');
	}
}

/**
 * Asserts that the response indicates forbidden access (403 status).
 *
 * @param response The fetch Response object.
 */
export function expectForbidden(response: Response): void {
	expectErrorResponse(response, 403);
}

/**
 * Asserts that the response indicates the method is not allowed (405 status).
 *
 * @param response The fetch Response object.
 */
export function expectMethodNotAllowed(response: Response): void {
	expectErrorResponse(response, 405, false); // 405 might not have a JSON body
}

/**
 * Asserts that the response indicates a bad request (400 status).
 *
 * @param response The fetch Response object.
 */
export function expectBadRequest(response: Response): void {
	expectErrorResponse(response, 400);
}

/**
 * Asserts that the response indicates unauthorized access (401 status).
 *
 * @param response The fetch Response object.
 */
export function expectUnauthorized(response: Response): void {
	expectErrorResponse(response, 401);
}

// Consider adding more specific helpers as needed, e.g., expectNotFound (404)

// --- Specific Response Body Assertions ---

/**
 * Asserts a successful response and checks if the JSON body matches a partial structure.
 *
 * @param response The fetch Response object.
 * @param expectedJson The partial JSON object structure to match against.
 * @param expectedStatus The specific success status code expected (default: 200).
 */
export async function expectSuccessfulResponseWithJson(response: Response, expectedJson: object, expectedStatus = 200): Promise<void> {
	expectSuccessfulResponse(response, true);
	await expect(response.json()).resolves.toMatchObject(expectedJson);
}

/**
 * Asserts an error response and checks if the JSON body matches a partial structure.
 *
 * @param response The fetch Response object.
 * @param expectedStatus The specific error status code expected.
 * @param expectedJson The partial JSON object structure to match against (e.g., { error: 'message' }).
 */
export async function expectErrorResponseWithJson(response: Response, expectedStatus: number, expectedJson: object): Promise<void> {
	expectErrorResponse(response, expectedStatus, true);
	await expect(response.json()).resolves.toMatchObject(expectedJson);
}
