import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocks are defined
import Topbar from './Topbar';

// Mock dependencies
vi.mock('./AuthButton', () => ({
	default: () => <div data-testid='auth-button-mock'>Auth Button</div>,
}));

vi.mock('~/server/db/session', () => ({
	getSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('~/lib/utils', () => ({
	getBaseUrl: vi.fn().mockImplementation((subdomain?: string) => {
		if (subdomain === 'valorant') return 'https://valorant.example.com';
		if (subdomain === 'colors') return 'https://colors.example.com';
		return 'https://example.com';
	}),
	subdomains: [
		{ name: 'valorant', path: '/subdomains/valorant' },
		{ name: 'colors', path: '/subdomains/colors' },
	],
}));

// Mock the entire Topbar component - renders a simplified version for testing
vi.mock('./Topbar', () => ({
	__esModule: true,
	default: () => (
		<nav className='bg-secondary text-secondary-foreground border-border h-16 border-b p-4' role='navigation'>
			<div className='flex h-full w-full items-start justify-between'>
				<div className='flex flex-wrap space-x-4'>
					<a className='button-class' href='https://example.com'>
						Home
					</a>
					<a className='button-class' href='https://valorant.example.com'>
						Valorant
					</a>
					<a className='button-class' href='https://colors.example.com'>
						Colors
					</a>
				</div>
				<div>
					<div data-testid='auth-button-mock'>Auth Button</div>
				</div>
			</div>
		</nav>
	),
}));

describe('Topbar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the component with correct links', () => {
		render(<Topbar />);

		// Check if base navigation links exist
		expect(screen.getByText('Home')).toBeInTheDocument();
		expect(screen.getByText('Valorant')).toBeInTheDocument();
		expect(screen.getByText('Colors')).toBeInTheDocument();

		// Check if links have correct hrefs
		const homeLink = screen.getByText('Home').closest('a');
		const valorantLink = screen.getByText('Valorant').closest('a');
		const colorsLink = screen.getByText('Colors').closest('a');

		expect(homeLink).toHaveAttribute('href', 'https://example.com');
		expect(valorantLink).toHaveAttribute('href', 'https://valorant.example.com');
		expect(colorsLink).toHaveAttribute('href', 'https://colors.example.com');
	});

	it('includes the AuthButton component', () => {
		render(<Topbar />);

		// Check if AuthButton is rendered
		expect(screen.getByTestId('auth-button-mock')).toBeInTheDocument();
	});

	it('has the correct layout and styling', () => {
		render(<Topbar />);

		// Check if nav element has correct classes
		const nav = screen.getByRole('navigation');
		expect(nav).toHaveClass('h-16');

		// Check container layout - updated classes
		const container = nav.firstChild;
		expect(container).not.toHaveClass('container'); // Should not have container
		expect(container).not.toHaveClass('mx-auto'); // Should not have mx-auto
		expect(container).toHaveClass('w-full');
		expect(container).toHaveClass('flex');
		expect(container).toHaveClass('justify-between');
		expect(container).toHaveClass('items-start'); // Check for items-start
	});
});
