import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// Mock framer-motion to avoid CSS parsing issues
vi.mock('framer-motion', async () => {
	const mock = await import('./mocks/framer-motion');
	return mock.default;
});

if (typeof window !== 'undefined') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
		})),
	});
}

if (typeof ResizeObserver === 'undefined') {
	global.ResizeObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));
}

if (typeof IntersectionObserver === 'undefined') {
	global.IntersectionObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
		root: null,
		rootMargin: '',
		thresholds: [],
	}));
}
