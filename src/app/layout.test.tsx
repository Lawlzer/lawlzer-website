import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RootLayout from './layout';

// Mock the components used in the layout
vi.mock('~/components/Topbar', () => ({
	default: () => <div data-testid='mock-topbar'>Mock Topbar</div>,
}));

vi.mock('./providers', () => ({
	Providers: ({ children }: { children: React.ReactNode }) => <div data-testid='mock-providers'>{children}</div>,
}));

describe('RootLayout', () => {
	it('renders correctly with children', () => {
		const testChild = <div data-testid='test-child'>Test Child Content</div>;

		render(<RootLayout>{testChild}</RootLayout>);

		// Check that providers are rendered
		const providers = screen.getByTestId('mock-providers');
		expect(providers).toBeInTheDocument();

		// Check that topbar is rendered
		const topbar = screen.getByTestId('mock-topbar');
		expect(topbar).toBeInTheDocument();

		// Check that the children are rendered
		const child = screen.getByTestId('test-child');
		expect(child).toBeInTheDocument();

		// Check that main element has the expected classes
		const mainElement = screen.getByRole('main');
		expect(mainElement).toHaveClass('absolute');
		expect(mainElement).toHaveClass('inset-x-0');
		expect(mainElement).toHaveClass('bottom-0');
		expect(mainElement).toHaveClass('top-16');
		expect(mainElement).toHaveClass('overflow-hidden');
	});

	it('has the correct html structure', () => {
		render(<RootLayout>Test content</RootLayout>);

		// Check html has correct lang attribute
		const html = document.documentElement;
		expect(html).toHaveAttribute('lang', 'en');

		// Check body has correct classes
		const body = document.body;
		expect(body).toHaveClass('flex');
		expect(body).toHaveClass('min-h-screen');
		expect(body).toHaveClass('flex-col');
		expect(body).toHaveClass('relative');
	});

	it('meets basic accessibility requirements', () => {
		render(<RootLayout>Content</RootLayout>);

		// Verify proper landmark regions exist
		expect(screen.getByRole('main')).toBeInTheDocument();

		// Verify no accessibility violations with the document structure
		const html = document.documentElement;
		expect(html.lang).toBe('en');
	});
});
