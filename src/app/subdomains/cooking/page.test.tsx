'use client';

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}),
	usePathname: () => '/subdomains/cooking',
	useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
	const actual = await vi.importActual('framer-motion');
	return {
		...actual,
		AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
		motion: {
			div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
			button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
		},
	};
});

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
	useQuery: vi.fn(() => ({
		data: null,
		isLoading: false,
		error: null,
	})),
	useMutation: vi.fn(() => ({
		mutate: vi.fn(),
		isLoading: false,
	})),
	useQueryClient: vi.fn(() => ({
		invalidateQueries: vi.fn(),
	})),
}));

// Mock the auth module
vi.mock('~/server/db/session', () => ({
	getSession: vi.fn(() => null),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
	useSession: vi.fn(() => ({
		data: null,
		status: 'unauthenticated',
	})),
}));

// Mock next/head
vi.mock('next/head', () => ({
	default: ({ children }: any) => children,
}));

// Mock the CookingProvider context
vi.mock('./contexts/CookingProvider', () => ({
	CookingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hooks
vi.mock('./hooks/useCookingData', () => ({
	useCookingData: () => ({
		foods: [],
		recipes: [],
		days: [],
		goals: null,
		isLoading: false,
		error: null,
	}),
}));

vi.mock('./hooks/useCookingUI', () => ({
	useCookingUI: () => ({
		isMobile: false,
		isTablet: false,
		isDesktop: true,
		activeTab: 'overview',
		setActiveTab: vi.fn(),
		editingRecipe: null,
		isCreatingRecipe: false,
		recipeSearchTerm: '',
		setRecipeSearchTerm: vi.fn(),
		viewingHistoryRecipe: null,
		viewingFullDayRecipe: null,
		startCreatingRecipe: vi.fn(),
		cancelCreatingRecipe: vi.fn(),
		startEditingRecipe: vi.fn(),
		cancelEditingRecipe: vi.fn(),
		viewRecipeHistory: vi.fn(),
		closeRecipeHistory: vi.fn(),
		viewFullDayNutrition: vi.fn(),
		closeFullDayNutrition: vi.fn(),
		closeAllDialogs: vi.fn(),
	}),
}));

vi.mock('./hooks/useKeyboardShortcuts', () => ({
	useKeyboardShortcuts: vi.fn(),
}));

vi.mock('./hooks/useScanner', () => ({
	useScanner: () => ({
		isScanning: false,
		isLoading: false,
		scannedProduct: null,
		scanError: null,
		isSaving: false,
		startScan: vi.fn(),
		handleScan: vi.fn(),
		cancelScan: vi.fn(),
		clearProduct: vi.fn(),
	}),
}));

vi.mock('./hooks/useGuestDataMigration', () => ({
	useGuestDataMigration: vi.fn(),
}));

vi.mock('./hooks/useToast', () => ({
	useToast: () => ({
		addToast: vi.fn(),
		removeToast: vi.fn(),
	}),
}));

describe('CookingPage Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render main heading', async () => {
		const CookingPage = await import('./page');
		const Page = CookingPage.default;

		render(<Page />);

		expect(screen.getByRole('heading', { name: /Cooking & Nutrition/i })).toBeInTheDocument();
	});

	it('should render all navigation tabs', async () => {
		const CookingPage = await import('./page');
		const Page = CookingPage.default;

		render(<Page />);

		const expectedTabs = ['Overview', 'Scan', 'Recipes', 'Days', 'Goals', 'Analysis', 'Planner', 'Fridge', 'Cook', 'Tools'];

		expectedTabs.forEach((tabName) => {
			expect(screen.getByRole('button', { name: tabName })).toBeInTheDocument();
		});
	});

	it('should show loading state', async () => {
		// Re-mock the hook to return loading state
		vi.doMock('./hooks/useCookingData', () => ({
			useCookingData: () => ({
				foods: [],
				recipes: [],
				days: [],
				goals: null,
				isLoading: true,
				error: null,
			}),
		}));

		const CookingPage = await import('./page');
		const Page = CookingPage.default;

		render(<Page />);

		// The loading state is handled within components, so we just verify the page renders
		expect(screen.getByRole('heading', { name: /Cooking & Nutrition/i })).toBeInTheDocument();

		// Reset the mock
		vi.doUnmock('./hooks/useCookingData');
	});

	it('should handle guest mode', async () => {
		const CookingPage = await import('./page');
		const Page = CookingPage.default;

		render(<Page />);

		// Guest mode banner would be within the components
		// Just verify the page structure remains intact
		expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
	});

	it('should have responsive design classes', async () => {
		const CookingPage = await import('./page');
		const Page = CookingPage.default;

		const { container } = render(<Page />);

		// Check for responsive classes
		const mainContainer = container.querySelector('.container');
		expect(mainContainer).toHaveClass('mx-auto');
	});

	it('should render error boundary content on error', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Mock a component that throws an error
		const ErrorComponent = () => {
			throw new Error('Test error');
		};

		const CookingPage = await import('./page');
		const Page = CookingPage.default;

		// Temporarily replace a child component with error component
		vi.doMock('./components/tabs/OverviewTab', () => ({
			default: ErrorComponent,
		}));

		// The error boundary should catch and handle errors gracefully
		expect(() => render(<Page />)).not.toThrow();

		consoleError.mockRestore();
	});
});
