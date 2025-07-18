import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BackToTop from './BackToTop';

// Mock the Button component
vi.mock('./ui/Button', () => ({
	Button: ({ children, onClick, className, 'aria-label': ariaLabel, ...props }: any) => (
		<button onClick={onClick} className={className} aria-label={ariaLabel} {...props}>
			{children}
		</button>
	),
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
	ChevronUpIcon: ({ className }: any) => <div className={className} data-testid="chevron-up-icon" />,
}));

describe('BackToTop', () => {
	beforeEach(() => {
		// Reset scroll position before each test
		window.scrollY = 0;
		// Clear all mocks
		vi.clearAllMocks();
	});

	it('should not render when scroll position is less than 300px', () => {
		render(<BackToTop />);
		expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
	});

	it('should render when scroll position is greater than 300px', async () => {
		render(<BackToTop />);
		
		// Simulate scrolling down
		window.scrollY = 400;
		fireEvent.scroll(window);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
		});
	});

	it('should hide when scrolling back up below 300px', async () => {
		render(<BackToTop />);
		
		// First scroll down
		window.scrollY = 400;
		fireEvent.scroll(window);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
		});

		// Then scroll back up
		window.scrollY = 200;
		fireEvent.scroll(window);

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
		});
	});

	it('should scroll to top when clicked', async () => {
		const scrollToMock = vi.fn();
		window.scrollTo = scrollToMock;

		render(<BackToTop />);
		
		// Make button visible
		window.scrollY = 400;
		fireEvent.scroll(window);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
		});

		// Click the button
		const button = screen.getByRole('button', { name: 'Back to top' });
		fireEvent.click(button);

		expect(scrollToMock).toHaveBeenCalledWith({
			top: 0,
			behavior: 'smooth',
		});
	});

	it('should have correct styling classes', async () => {
		render(<BackToTop />);
		
		// Make button visible
		window.scrollY = 400;
		fireEvent.scroll(window);

		await waitFor(() => {
			const button = screen.getByRole('button', { name: 'Back to top' });
			expect(button).toHaveClass('fixed', 'bottom-8', 'right-8', 'z-50');
		});
	});

	it('should render chevron up icon', async () => {
		render(<BackToTop />);
		
		// Make button visible
		window.scrollY = 400;
		fireEvent.scroll(window);

		await waitFor(() => {
			expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
		});
	});

	it('should throttle scroll events', async () => {
		const { rerender } = render(<BackToTop />);
		
		// Trigger multiple scroll events rapidly
		for (let i = 0; i < 10; i++) {
			window.scrollY = 350 + i;
			fireEvent.scroll(window);
		}

		// Should still only show once despite multiple events
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
		});
	});

	it('should clean up scroll event listener on unmount', () => {
		const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
		
		const { unmount } = render(<BackToTop />);
		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
	});
});