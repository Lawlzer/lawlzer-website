import { vi } from 'vitest';

import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';

// Fix AbortSignal/AbortController for Next.js tests
// Import the full polyfill which patches fetch and provides AbortController
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';

// Mock NextRequest to bypass AbortSignal type checking issues in tests
vi.mock('next/dist/server/web/spec-extension/request', () => {
  return {
    NextRequest: vi.fn().mockImplementation((input, init) => {
      // Remove signal from init to avoid type checking issues
      const { signal, ...restInit } = init || {};

      // Create a basic Request object
      const request = new Request(input, restInit);

      // Add Next.js specific properties
      return Object.assign(request, {
        nextUrl: new URL(input, 'http://localhost:3000'),
        cookies: {
          get: vi.fn(),
          getAll: vi.fn(() => []),
          set: vi.fn(),
          delete: vi.fn(),
        },
        geo: {},
        ip: undefined,
      });
    }),
  };
});

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
