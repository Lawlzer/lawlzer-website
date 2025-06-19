'use client';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ErrorComponent from './error';

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;

describe('Error Component', () => {
	const mockReset = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		console.error = vi.fn();
		// Mock window.location.href
		Object.defineProperty(window, 'location', {
			value: { href: '' },
			writable: true,
		});
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	it('should render error message correctly', () => {
		const error = new Error('Test error message');
		render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
		expect(screen.getByText('We apologize for the inconvenience. An unexpected error has occurred.')).toBeInTheDocument();
	});

	it('should display error digest when provided', () => {
		const error = new Error('Test error') as Error & { digest?: string };
		error.digest = 'ABC123';

		render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		expect(screen.getByText('Error ID: ABC123')).toBeInTheDocument();
	});

	it('should not display error digest when not provided', () => {
		const error = new Error('Test error');
		render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();
	});

	it('should call reset function when Try again button is clicked', () => {
		const error = new Error('Test error');
		render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		const tryAgainButton = screen.getByRole('button', { name: /Try again/i });
		fireEvent.click(tryAgainButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it('should navigate to home when Go home button is clicked', () => {
		const error = new Error('Test error');
		render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		const goHomeButton = screen.getByRole('button', { name: /Go home/i });
		fireEvent.click(goHomeButton);

		expect(window.location.href).toBe('/');
	});

	it('should log error to console on mount', () => {
		const error = new Error('Test error message');
		render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		expect(console.error).toHaveBeenCalledWith('Application error:', error);
	});

	it('should render with proper styling classes', () => {
		const error = new Error('Test error');
		const { container } = render(React.createElement(ErrorComponent, { error, reset: mockReset }));

		// Check for main container
		const mainContainer = container.querySelector('.flex.min-h-screen.items-center.justify-center');
		expect(mainContainer).toBeInTheDocument();

		// Check for icon
		const icon = container.querySelector('.text-destructive');
		expect(icon).toBeInTheDocument();

		// Check for buttons with proper styling
		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(2);
		expect(buttons[0]).toHaveClass('bg-primary');
		expect(buttons[1]).toHaveClass('border-border');
	});
});
