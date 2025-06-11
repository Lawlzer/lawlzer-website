import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser } from '../../testUtils/unit/auth.helpers';
import { renderWithProviders } from '../../testUtils/unit/render.helpers';

// Import after mocks are defined
import Topbar from './Topbar';

// Mock dependencies
vi.mock('./AuthButton', () => ({
	default: ({ initialSession }: any) => {
		const user = initialSession?.user;
		if (user) {
			return <div data-testid='auth-button'>{user.name || user.email || 'Account'}</div>;
		}
		return <div data-testid='auth-button'>Sign In</div>;
	},
}));

vi.mock('./ProtectedLink', () => ({
	default: ({ href, children, className, onClick }: any) => (
		<a href={href} className={className} onClick={onClick}>
			{children}
		</a>
	),
}));

vi.mock('~/server/db/session', () => ({
	getSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('~/lib/utils', () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(' '),
	getBaseUrl: (subdomain?: string) => {
		if (subdomain !== undefined && subdomain !== '' && subdomain !== null) {
			return `http://localhost:3000/${subdomain}`;
		}
		return 'http://localhost:3000';
	},
	subdomains: [
		{ name: 'colors', description: 'Color tools' },
		{ name: 'valorant', description: 'Valorant tools' },
	],
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
	usePathname: () => '/',
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
	// Filter out framer-motion specific props
	const filterMotionProps = (props: any): Record<string, any> => {
		const { initial, animate, exit, transition, variants, whileHover, whileTap, whileDrag, whileFocus, whileInView, drag, dragConstraints, dragElastic, dragMomentum, layoutId, layout, layoutDependency, onAnimationStart, onAnimationComplete, ...validProps } = props;
		return validProps as Record<string, any>;
	};

	return {
		motion: {
			div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
			button: ({ children, ...props }: any) => <button {...filterMotionProps(props)}>{children}</button>,
			nav: ({ children, ...props }: any) => <nav {...filterMotionProps(props)}>{children}</nav>,
			a: ({ children, ...props }: any) => <a {...filterMotionProps(props)}>{children}</a>,
		},
		AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	};
});

describe('Topbar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe('Desktop Navigation', () => {
		it('should render all navigation links', () => {
			const { getByText } = renderWithProviders(<Topbar session={null} />);

			expect(getByText('Home')).toBeInTheDocument();
			expect(getByText('Colors')).toBeInTheDocument();
			expect(getByText('Valorant')).toBeInTheDocument();
		});

		it('should not show mobile menu button on desktop', () => {
			const { container } = renderWithProviders(<Topbar session={null} />);
			const mobileButton = container.querySelector('[aria-label="Toggle menu"]');

			// The button exists but is hidden on desktop (md:hidden class)
			expect(mobileButton).toBeInTheDocument();
			expect(mobileButton).toHaveClass('md:hidden');
		});
	});

	describe('Mobile Navigation', () => {
		it('should show mobile menu button', () => {
			const { getByLabelText } = renderWithProviders(<Topbar session={null} />);
			const menuButton = getByLabelText('Toggle menu');

			expect(menuButton).toBeInTheDocument();
		});

		it('should toggle mobile menu when button is clicked', async () => {
			const { getByLabelText, queryByText } = renderWithProviders(<Topbar session={null} />);
			const menuButton = getByLabelText('Toggle menu');

			// Menu should be closed initially (mobile menu items not visible)
			expect(queryByText('Home')).toBeVisible(); // Desktop nav is visible

			// Open menu
			fireEvent.click(menuButton);

			// Now there should be two "Home" links - one for desktop, one for mobile
			await waitFor(() => {
				const homeLinks = screen.getAllByText('Home');
				expect(homeLinks).toHaveLength(2); // Desktop + Mobile
			});
		});

		it('should close mobile menu when backdrop is clicked', async () => {
			const { getByLabelText, container } = renderWithProviders(<Topbar session={null} />);
			const menuButton = getByLabelText('Toggle menu');

			// Open menu
			fireEvent.click(menuButton);

			// Find and click backdrop
			await waitFor(() => {
				const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
				expect(backdrop).toBeInTheDocument();
				fireEvent.click(backdrop!);
			});

			// Menu should be closed
			await waitFor(() => {
				const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
				expect(backdrop).not.toBeInTheDocument();
			});
		});
	});

	describe('Scroll Effects', () => {
		it('should add scrolled styles when page is scrolled', async () => {
			const { container } = renderWithProviders(<Topbar session={null} />);
			const nav = container.querySelector('nav#navigation');

			// Initial state - not scrolled
			expect(nav).toHaveClass('bg-background/60');

			// Simulate scroll
			window.scrollY = 50;
			fireEvent.scroll(window);

			await waitFor(() => {
				expect(nav).toHaveClass('bg-background/80');
			});
		});
	});

	describe('Authentication Integration', () => {
		it('should show AuthButton with session when logged in', () => {
			const mockUser = createMockUser();
			const mockSession = {
				user: mockUser,
				expires: new Date(Date.now() + 1000 * 60 * 60),
			};

			const { getByText } = renderWithProviders(<Topbar session={mockSession} />);
			expect(getByText('Test User')).toBeInTheDocument();
		});

		it('should show AuthButton without session when logged out', () => {
			const { getByText } = renderWithProviders(<Topbar session={null} />);
			expect(getByText('Sign In')).toBeInTheDocument();
		});
	});

	it('renders the component with correct links', () => {
		render(<Topbar session={null} />);

		// Check if base navigation links exist
		expect(screen.getByText('Home')).toBeInTheDocument();
		expect(screen.getByText('Valorant')).toBeInTheDocument();
		expect(screen.getByText('Colors')).toBeInTheDocument();

		// Check if links have correct hrefs
		const homeLink = screen.getByText('Home').closest('a');
		const valorantLink = screen.getByText('Valorant').closest('a');
		const colorsLink = screen.getByText('Colors').closest('a');

		expect(homeLink).toHaveAttribute('href', 'http://localhost:3000');
		expect(valorantLink).toHaveAttribute('href', 'http://localhost:3000/valorant');
		expect(colorsLink).toHaveAttribute('href', 'http://localhost:3000/colors');
	});

	it('includes the AuthButton component', () => {
		render(<Topbar session={null} />);

		// Check if AuthButton is rendered
		expect(screen.getByTestId('auth-button')).toBeInTheDocument();
	});

	it('has the correct layout and styling', () => {
		render(<Topbar session={null} />);

		// Check if nav element exists and has id
		const nav = screen.getByRole('navigation');
		expect(nav).toHaveAttribute('id', 'navigation');

		// Check container layout
		const container = nav.querySelector('.mx-auto');
		expect(container).toBeInTheDocument();
		expect(container).toHaveClass('flex');
		expect(container).toHaveClass('justify-between');
		expect(container).toHaveClass('items-center');
	});
});
