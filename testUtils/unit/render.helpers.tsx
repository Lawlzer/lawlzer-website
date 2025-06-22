import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, type RenderOptions, type RenderResult } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import React, { type ReactElement } from 'react';
import { vi } from 'vitest';
import { ToastProvider } from '~/components/Toast';

// Mock Next.js router
const mockRouter = {
	basePath: '',
	pathname: '/',
	route: '/',
	query: {},
	asPath: '/',
	push: vi.fn(async () => true),
	replace: vi.fn(async () => true),
	reload: vi.fn(),
	back: vi.fn(),
	prefetch: vi.fn(async () => undefined),
	beforePopState: vi.fn(),
	events: {
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn(),
	},
	isFallback: false,
	isLocaleDomain: false,
	isReady: true,
	isPreview: false,
};

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
	useRouter: () => mockRouter,
	usePathname: () => mockRouter.pathname,
	useSearchParams: () => new URLSearchParams(mockRouter.query as Record<string, string>),
}));

interface TestProvidersProps {
	children: React.ReactNode;
	theme?: string;
	queryClient?: QueryClient;
}

// Create a wrapper component with all common providers
function TestProviders({ children, theme = 'light', queryClient }: TestProvidersProps) {
	const client =
		queryClient ||
		new QueryClient({
			defaultOptions: {
				queries: {
					retry: false, // Don't retry in tests
					gcTime: 0, // Don't cache in tests
				},
			},
		});

	return (
		<QueryClientProvider client={client}>
			<ThemeProvider attribute='class' defaultTheme={theme} enableSystem={false} disableTransitionOnChange>
				<ToastProvider>{children}</ToastProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
	theme?: string;
	queryClient?: QueryClient;
	route?: string;
}

// Custom render function that includes providers
export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions): RenderResult {
	const { theme, queryClient, route, ...renderOptions } = options || {};

	// Update mock router if route is provided
	if (route !== undefined && route !== null && route !== '') {
		mockRouter.pathname = route;
		mockRouter.route = route;
		mockRouter.asPath = route;
	}

	return rtlRender(ui, {
		wrapper: ({ children }) => (
			<TestProviders theme={theme} queryClient={queryClient}>
				{children}
			</TestProviders>
		),
		...renderOptions,
	});
}

// Re-export everything from testing library
export * from '@testing-library/react';

// Export the custom render as the default render
export { renderWithProviders as render };

// Utility to create a test QueryClient with specific data
export function createTestQueryClient(initialData?: Record<string, unknown>): QueryClient {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});

	// Pre-populate query cache if initial data is provided
	if (initialData) {
		Object.entries(initialData).forEach(([key, data]) => {
			queryClient.setQueryData([key], data);
		});
	}

	return queryClient;
}

// Helper to wait for async component updates
export async function waitForComponentUpdate(): Promise<void> {
	// Wait for next tick
	await new Promise((resolve) => {
		process.nextTick(resolve);
	});
}

// Helper to mock component props with defaults
export function createMockProps<T extends Record<string, unknown>>(defaults: T, overrides?: Partial<T>): T {
	return {
		...defaults,
		...overrides,
	};
}
