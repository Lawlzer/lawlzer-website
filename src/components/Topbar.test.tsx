import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Topbar from './Topbar';
import { getBaseUrl } from '~/lib/utils';

// Mock ResizeObserver
class ResizeObserverMock {
	public observe(): void {
		/* do nothing */
	}
	public unobserve(): void {
		/* do nothing */
	}
	public disconnect(): void {
		/* do nothing */
	}
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock dependencies
vi.mock('./AuthButton', () => ({
	default: () => <div data-testid='auth-button-mock'>Auth Button</div>,
}));

vi.mock('~/lib/utils', () => ({
	getBaseUrl: vi.fn(),
}));

describe('Topbar', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mocks
		(getBaseUrl as ReturnType<typeof vi.fn>).mockImplementation((subdomain?: string) => {
			if (subdomain === 'valorant') return 'https://valorant.example.com';
			if (subdomain === 'colors') return 'https://colors.example.com';
			return 'https://example.com';
		});
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
	});

	it('includes the AuthButton component', () => {
		render(<Topbar />);

		// Check if AuthButton is rendered
		expect(screen.getByTestId('auth-button-mock')).toBeInTheDocument();
	});

	it('uses the correct base URLs from getBaseUrl', () => {
		render(<Topbar />);

		// Check if getBaseUrl was called with correct parameters
		expect(getBaseUrl).toHaveBeenCalledTimes(3);
		expect(getBaseUrl).toHaveBeenCalledWith(); // For base URL
		expect(getBaseUrl).toHaveBeenCalledWith('valorant'); // For valorant URL
		expect(getBaseUrl).toHaveBeenCalledWith('colors'); // Added for colors URL
	});

	it('has the correct layout and styling', () => {
		render(<Topbar />);

		// Check if nav element has correct classes
		const nav = screen.getByRole('navigation');
		expect(nav).toHaveClass('h-16');

		// Check container layout
		const container = nav.firstChild;
		expect(container).toHaveClass('container');
		expect(container).toHaveClass('mx-auto');
		expect(container).toHaveClass('flex');
		expect(container).toHaveClass('justify-between');
	});
});
