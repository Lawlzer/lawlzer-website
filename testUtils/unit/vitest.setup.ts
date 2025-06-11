import { vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

// Mock framer-motion to avoid CSS parsing issues
vi.mock('framer-motion', async () => {
	const mock = await import('./mocks/framer-motion');
	return mock.default;
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
	})),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
	root: null,
	rootMargin: '',
	thresholds: [],
})) as unknown as typeof IntersectionObserver;
