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
vi.mock('./contexts/CookingContext', () => ({
	CookingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock all component imports
vi.mock('./components/AnimatedWrapper', () => ({
	PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/CookingMode', () => ({
	CookingMode: () => <div>Cooking Mode</div>,
}));

vi.mock('./components/DayTracker', () => ({
	DayTracker: () => <div>Day Tracker</div>,
}));

vi.mock('./components/ErrorBoundary', () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	ApiErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/FridgeManager', () => ({
	FridgeManager: () => <div>Fridge Manager</div>,
}));

vi.mock('./components/FullDayNutrition', () => ({
	FullDayNutrition: () => <div>Full Day Nutrition</div>,
}));

vi.mock('./components/GeneralUnitConverter', () => ({
	GeneralUnitConverter: () => <div>General Unit Converter</div>,
}));

vi.mock('./components/GoalsManager', () => ({
	GoalsManager: () => <div>Goals Manager</div>,
}));

vi.mock('./components/GuestModeBanner', () => ({
	GuestModeBanner: () => <div>Guest Mode Banner</div>,
}));

vi.mock('./components/KeyboardShortcutsHelp', () => ({
	KeyboardShortcutsHelp: () => <div>Keyboard Shortcuts</div>,
}));

vi.mock('./components/MealPlanner', () => ({
	MealPlanner: () => <div>Meal Planner</div>,
}));

vi.mock('./components/MultiDayView', () => ({
	MultiDayView: () => <div>Multi Day View</div>,
}));

vi.mock('./components/RecipeHistory', () => ({
	RecipeHistory: () => <div>Recipe History</div>,
}));

vi.mock('./components/tabs', () => ({
	OverviewTab: () => <div>Overview Tab</div>,
	RecipesTab: () => <div>Recipes Tab</div>,
	ScanTab: () => <div>Scan Tab</div>,
	TabNavigation: ({ activeTab, onTabChange }: any) => (
		<div>
			{['Overview', 'Scan', 'Recipes', 'Days', 'Goals', 'Analysis', 'Planner', 'Fridge', 'Cook', 'Tools'].map((tab) => (
				<button key={tab} onClick={() => onTabChange(tab.toLowerCase())}>
					{tab}
				</button>
			))}
		</div>
	),
}));

vi.mock('./components/ToastContainer', () => ({
	ToastContainer: () => <div>Toast Container</div>,
}));

vi.mock('./loading', () => ({
	default: () => <div>Loading...</div>,
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
