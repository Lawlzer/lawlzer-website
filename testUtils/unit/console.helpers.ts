import type { MockInstance } from 'vitest';
import { vi } from 'vitest';

export interface ConsoleMock {
	spy: MockInstance;
	restore: () => void;
}

/**
 * Mocks console.error to suppress output during tests.
 * Useful for tests that verify error handling behavior.
 *
 * @returns ConsoleMock object with spy and restore function
 *
 * @example
 * ```typescript
 * const consoleMock = mockConsoleError();
 * // ... test code that logs errors ...
 * consoleMock.restore();
 * ```
 */
export function mockConsoleError(): ConsoleMock {
	const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
	return {
		spy,
		restore: () => {
			spy.mockRestore();
		},
	};
}

/**
 * Mocks console.debug to suppress output during tests.
 *
 * @returns ConsoleMock object with spy and restore function
 */
export function mockConsoleDebug(): ConsoleMock {
	const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
	return {
		spy,
		restore: () => {
			spy.mockRestore();
		},
	};
}

/**
 * Mocks console.log to suppress output during tests.
 *
 * @returns ConsoleMock object with spy and restore function
 */
export function mockConsoleLog(): ConsoleMock {
	const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
	return {
		spy,
		restore: () => {
			spy.mockRestore();
		},
	};
}

/**
 * Mocks console.warn to suppress output during tests.
 *
 * @returns ConsoleMock object with spy and restore function
 */
export function mockConsoleWarn(): ConsoleMock {
	const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	return {
		spy,
		restore: () => {
			spy.mockRestore();
		},
	};
}

/**
 * Mocks multiple console methods at once.
 *
 * @param methods Array of console methods to mock
 * @returns Object with restore function to restore all mocks
 *
 * @example
 * ```typescript
 * const consoleMocks = mockConsole(['error', 'debug', 'log']);
 * // ... test code ...
 * consoleMocks.restore();
 * ```
 */
export function mockConsole(methods: ('debug' | 'error' | 'log' | 'warn')[]): {
	mocks: Record<string, ConsoleMock>;
	restore: () => void;
} {
	const mocks: Record<string, ConsoleMock> = {};

	methods.forEach((method) => {
		switch (method) {
			case 'error':
				mocks.error = mockConsoleError();
				break;
			case 'debug':
				mocks.debug = mockConsoleDebug();
				break;
			case 'log':
				mocks.log = mockConsoleLog();
				break;
			case 'warn':
				mocks.warn = mockConsoleWarn();
				break;
		}
	});

	return {
		mocks,
		restore: () => {
			Object.values(mocks).forEach((mock) => {
				mock.restore();
			});
		},
	};
}

/**
 * Utility to wrap a test function with console mocking.
 * Automatically restores console after test completes.
 *
 * @param methods Console methods to mock
 * @param testFn Test function to run
 *
 * @example
 * ```typescript
 * it('should handle errors', () => {
 *   return withMockedConsole(['error'], async () => {
 *     // test code that logs errors
 *   });
 * });
 * ```
 */
export async function withMockedConsole<T>(methods: ('debug' | 'error' | 'log' | 'warn')[], testFn: () => Promise<T> | T): Promise<T> {
	const consoleMocks = mockConsole(methods);
	try {
		return await testFn();
	} finally {
		consoleMocks.restore();
	}
}
