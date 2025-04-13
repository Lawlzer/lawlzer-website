import type { MockedFunction, Mock } from 'vitest';
import { vi } from 'vitest';
import { db } from '~/server/db';

export function mockEnv(envOverrides: Record<string, unknown>): void {
	// Use vi.doMock and importActual to merge mocks with actual env
	vi.doMock('~/env', async () => {
		// Import the actual module - Allow type inference
		const actualEnvModule = await vi.importActual('~/env');

		// Construct the mocked env object
		const mockedEnv = {
			// Spread the actual environment variables
			...(actualEnvModule as any).env, // Use 'as any' to bypass potential type issue
			// Apply specific test defaults/overrides
			NODE_ENV: 'test', // Ensure test environment
			// Apply user-provided overrides last
			...envOverrides,
		};

		// Return the mocked module structure, including both env and authUrl
		return {
			env: mockedEnv,
			// Use the authUrl from the actual module unless explicitly overridden
			authUrl: (actualEnvModule as any).authUrl, // Use 'as any' to bypass potential type issue
		};
	});
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
