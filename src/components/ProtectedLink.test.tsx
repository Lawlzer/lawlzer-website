import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedLink from './ProtectedLink';

// Mock Next.js Link component
vi.mock('next/link', () => ({
	default: ({ children, onClick, href, className, ...props }: any) => {
		// Create a mock link that prevents default navigation
		const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
			// Always prevent default to avoid JSDOM navigation errors
			e.preventDefault();
			// Call the onClick handler if provided
			if (onClick) {
				onClick(e);
			}
		};

		return (
			<a href={typeof href === 'string' ? href : href?.pathname || '/'} onClick={handleClick} className={className} {...props}>
				{children}
			</a>
		);
	},
}));

describe('ProtectedLink', () => {
	beforeEach(() => {
		// Clear all mocks and reset window
		vi.clearAllMocks();
		// Reset the global function
		if (window.__NEXT_PROTECT_UNSAVED_CHANGES__) {
			delete window.__NEXT_PROTECT_UNSAVED_CHANGES__;
		}
	});

	it('should render children and basic link', () => {
		render(
			<ProtectedLink href='/test'>
				<span>Test Link</span>
			</ProtectedLink>
		);

		const link = screen.getByRole('link');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/test');
		expect(screen.getByText('Test Link')).toBeInTheDocument();
	});

	it('should apply className prop', () => {
		render(
			<ProtectedLink href='/test' className='custom-class'>
				Test Link
			</ProtectedLink>
		);

		const link = screen.getByRole('link');
		expect(link).toHaveClass('custom-class');
	});

	it('should allow navigation when no protection function exists', () => {
		render(<ProtectedLink href='/test'>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');

		// Should render without errors and be clickable
		expect(() => fireEvent.click(link)).not.toThrow();
		expect(link).toHaveAttribute('href', '/test');
	});

	it('should prevent navigation when protection function returns true', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		render(<ProtectedLink href='/test'>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		// Should call the protection function with the correct path
		expect(mockProtectFunction).toHaveBeenCalledWith('/test');
		expect(mockProtectFunction).toHaveBeenCalledTimes(1);
	});

	it('should allow navigation when protection function returns false', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(false);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		render(<ProtectedLink href='/test'>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		// Should call the protection function
		expect(mockProtectFunction).toHaveBeenCalledWith('/test');
		// Navigation is handled by the protection function returning false
		expect(mockProtectFunction).toHaveBeenCalledTimes(1);
	});

	it('should handle string href', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		render(<ProtectedLink href='/test/path'>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		expect(mockProtectFunction).toHaveBeenCalledWith('/test/path');
	});

	it('should handle URL object href', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;
		const urlObject = new URL('https://example.com/test');

		render(<ProtectedLink href={urlObject}>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		expect(mockProtectFunction).toHaveBeenCalledWith('https://example.com/test');
	});

	it('should handle object href with pathname, search, and hash', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		const hrefObject = {
			pathname: '/test',
			search: '?query=value',
			hash: '#section',
		};

		render(<ProtectedLink href={hrefObject as any}>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		expect(mockProtectFunction).toHaveBeenCalledWith('/test?query=value#section');
	});

	it('should handle partial object href', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		const hrefObject = {
			pathname: '/test',
		};

		render(<ProtectedLink href={hrefObject as any}>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		expect(mockProtectFunction).toHaveBeenCalledWith('/test');
	});

	it('should handle null href gracefully', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		render(<ProtectedLink href={null as any}>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');
		fireEvent.click(link);

		expect(mockProtectFunction).toHaveBeenCalledWith('');
	});

	it('should pass through additional props to Link component', () => {
		render(
			<ProtectedLink href='/test' {...({ target: '_blank', rel: 'noopener noreferrer', 'data-testid': 'custom-link' } as any)}>
				Test Link
			</ProtectedLink>
		);

		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		expect(link).toHaveAttribute('data-testid', 'custom-link');
	});

	it('should work with complex children', () => {
		render(
			<ProtectedLink href='/test'>
				<div>
					<span>Complex</span>
					<strong>Children</strong>
				</div>
			</ProtectedLink>
		);

		expect(screen.getByText('Complex')).toBeInTheDocument();
		expect(screen.getByText('Children')).toBeInTheDocument();
	});

	it('should handle rapid clicks correctly', () => {
		const mockProtectFunction = vi.fn().mockReturnValue(true);
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		render(<ProtectedLink href='/test'>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');

		// Click multiple times rapidly
		fireEvent.click(link);
		fireEvent.click(link);
		fireEvent.click(link);

		// Each click should trigger the protection check
		expect(mockProtectFunction).toHaveBeenCalledTimes(3);
	});

	it('should handle protection function that throws error', () => {
		// Mock console.error to check it was called
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const mockProtectFunction = vi.fn().mockImplementation(() => {
			throw new Error('Protection function error');
		});
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = mockProtectFunction;

		render(<ProtectedLink href='/test'>Test Link</ProtectedLink>);

		const link = screen.getByRole('link');

		// The error will be caught and logged
		fireEvent.click(link);

		// Function should have been called
		expect(mockProtectFunction).toHaveBeenCalled();
		// Should log the error
		expect(consoleErrorSpy).toHaveBeenCalledWith('Error in navigation protection function:', expect.any(Error));

		// Restore console.error
		consoleErrorSpy.mockRestore();
	});
});
