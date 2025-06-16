import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './Toast';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, layout, initial, animate, exit, ...props }: any) => <div {...props}>{children}</div>,
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Test component that uses the toast hook
const TestComponent = ({ onMount }: { onMount?: (toast: ReturnType<typeof useToast>) => void }) => {
	const toast = useToast();

	React.useEffect(() => {
		if (onMount) {
			onMount(toast);
		}
	}, [onMount, toast]);

	return (
		<div>
			<button onClick={() => toast.addToast('Success message', 'success')}>Show Success</button>
			<button onClick={() => toast.addToast('Error message', 'error')}>Show Error</button>
			<button onClick={() => toast.addToast('Warning message', 'warning')}>Show Warning</button>
			<button onClick={() => toast.addToast('Info message', 'info')}>Show Info</button>
			<button onClick={() => toast.addToast('Custom duration', 'info', 1000)}>Show Custom Duration</button>
		</div>
	);
};

describe('Toast', () => {
	let mockId = 0;

	beforeEach(() => {
		mockId = 0;
		vi.useFakeTimers();
		// Mock Date.now() to return incremental values for unique IDs
		vi.spyOn(Date, 'now').mockImplementation(() => ++mockId);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	describe('ToastProvider', () => {
		it('should render children correctly', () => {
			render(
				<ToastProvider>
					<div>Test Content</div>
				</ToastProvider>
			);

			expect(screen.getByText('Test Content')).toBeInTheDocument();
		});

		it('should throw error when useToast is used outside provider', () => {
			// Suppress console.error for this test
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const TestComponentWithoutProvider = () => {
				try {
					useToast();
					return <div>Should not render</div>;
				} catch (error: any) {
					return <div>{error.message}</div>;
				}
			};

			render(<TestComponentWithoutProvider />);
			expect(screen.getByText('useToast must be used within a ToastProvider')).toBeInTheDocument();

			consoleSpy.mockRestore();
		});
	});

	describe('Toast Functionality', () => {
		it('should display success toast when triggered', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Success'));

			expect(screen.getByText('Success message')).toBeInTheDocument();
		});

		it('should display error toast with correct styling', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Error'));

			const toast = screen.getByText('Error message').closest('div')?.parentElement;
			expect(toast).toHaveClass('from-destructive/20', 'to-destructive/10', 'border-destructive/30');
		});

		it('should display warning toast', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Warning'));

			expect(screen.getByText('Warning message')).toBeInTheDocument();
		});

		it('should display info toast', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Info'));

			expect(screen.getByText('Info message')).toBeInTheDocument();
		});

		it('should display multiple toasts', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Success'));
			fireEvent.click(screen.getByText('Show Error'));

			expect(screen.getByText('Success message')).toBeInTheDocument();
			expect(screen.getByText('Error message')).toBeInTheDocument();
		});

		it('should remove toast when close button is clicked', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Success'));

			expect(screen.getByText('Success message')).toBeInTheDocument();

			// Find and click the close button (X icon)
			const closeButton = screen.getByText('Success message').parentElement?.querySelector('button');
			expect(closeButton).toBeInTheDocument();
			fireEvent.click(closeButton!);

			expect(screen.queryByText('Success message')).not.toBeInTheDocument();
		});

		it('should auto-dismiss toast after default duration', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Success'));

			expect(screen.getByText('Success message')).toBeInTheDocument();

			// Fast-forward time by 5 seconds (default duration)
			act(() => {
				vi.advanceTimersByTime(5000);
			});

			expect(screen.queryByText('Success message')).not.toBeInTheDocument();
		});

		it('should auto-dismiss toast after custom duration', () => {
			render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			fireEvent.click(screen.getByText('Show Custom Duration'));

			expect(screen.getByText('Custom duration')).toBeInTheDocument();

			// Fast-forward time by 1 second (custom duration)
			act(() => {
				vi.advanceTimersByTime(1000);
			});

			expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
		});

		it('should display correct icons for each toast type', () => {
			const { container } = render(
				<ToastProvider>
					<TestComponent />
				</ToastProvider>
			);

			// Show all types of toasts
			fireEvent.click(screen.getByText('Show Success'));
			fireEvent.click(screen.getByText('Show Error'));
			fireEvent.click(screen.getByText('Show Warning'));
			fireEvent.click(screen.getByText('Show Info'));

			// Check that we have 4 different toast icons
			const icons = container.querySelectorAll('svg.h-5.w-5');
			expect(icons).toHaveLength(4);
		});
	});
});
