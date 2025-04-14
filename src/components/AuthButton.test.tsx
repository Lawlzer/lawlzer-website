import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthButton from './AuthButton';

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

// Mock window.location
const mockWindowLocation = vi.fn();
Object.defineProperty(window, 'location', {
	value: {
		href: '',
	},
	writable: true,
});

// Mock fetch API
global.fetch = vi.fn();

// Mock console.error
console.error = vi.fn();

describe('AuthButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup(); // Clean up after each test
	});

	it('shows loading state initially', () => {
		render(<AuthButton />);

		const loadingElement = screen.getByTestId('auth-loading');
		expect(loadingElement).toBeInTheDocument();
		expect(loadingElement).toHaveClass('animate-pulse');
	});

	it('shows login options when user is not authenticated', async () => {
		// Mock fetch response for no session
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => null,
		});

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toBeInTheDocument();
		});

		// Open the menu
		fireEvent.click(screen.getByRole('button', { name: /login/i }));

		// Check login options
		expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
		expect(screen.getByText('Sign in with Discord')).toBeInTheDocument();
		expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
	});

	it('redirects to Google login when selected', async () => {
		// Mock fetch response for no session
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => null,
		});

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toBeInTheDocument();
		});

		// Open the menu
		fireEvent.click(screen.getByRole('button', { name: /login/i }));

		// Click on Google login
		fireEvent.click(screen.getByText('Sign in with Google'));

		// Check if window.location.href was set correctly
		expect(window.location.href).toBe('/api/auth/login?provider=google');
	});

	it('redirects to Discord login when selected', async () => {
		// Mock fetch response for no session
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => null,
		});

		window.location.href = ''; // Reset from previous tests

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toBeInTheDocument();
		});

		// Open the menu
		fireEvent.click(screen.getByRole('button', { name: /login/i }));

		// Click on Discord login
		fireEvent.click(screen.getByText('Sign in with Discord'));

		// Check if window.location.href was set correctly
		expect(window.location.href).toBe('/api/auth/login?provider=discord');
	});

	it('redirects to GitHub login when selected', async () => {
		// Mock fetch response for no session
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => null,
		});

		window.location.href = ''; // Reset from previous tests

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toBeInTheDocument();
		});

		// Open the menu
		fireEvent.click(screen.getByRole('button', { name: /login/i }));

		// Click on GitHub login
		fireEvent.click(screen.getByText('Sign in with GitHub'));

		// Check if window.location.href was set correctly
		expect(window.location.href).toBe('/api/auth/login?provider=github');
	});

	it('shows user info and logout option when authenticated', async () => {
		// Mock fetch response for authenticated session
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: {
					name: 'Test User',
					email: 'test@example.com',
				},
			}),
		});

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			expect(screen.getByText('Test User')).toBeInTheDocument();
		});

		// Open the menu
		fireEvent.click(screen.getByText('Test User'));

		// Check for logout option
		expect(screen.getByText('Logout')).toBeInTheDocument();

		// Click logout
		fireEvent.click(screen.getByText('Logout'));

		// Verify redirect to logout endpoint
		expect(window.location.href).toBe('/api/auth/logout');
	});

	it('uses email as fallback when name is null', async () => {
		// Mock fetch response with only email
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: {
					name: null,
					email: 'test@example.com',
				},
			}),
		});

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			expect(screen.getByText('test@example.com')).toBeInTheDocument();
		});
	});

	it('uses "Account" as fallback when name and email are null', async () => {
		// Mock fetch response with null name and email
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: {
					name: null,
					email: null,
				},
			}),
		});

		render(<AuthButton />);

		// Wait for fetch to complete
		await waitFor(() => {
			expect(screen.getByText('Account')).toBeInTheDocument();
		});
	});

	it('handles fetch errors and shows login options', async () => {
		// Mock fetch error
		(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

		render(<AuthButton />);

		// Wait for error handling
		await waitFor(() => {
			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toBeInTheDocument();
		});

		// Verify console.error was called
		expect(console.error).toHaveBeenCalledWith('Error fetching session:', expect.any(Error));
	});

	it('handles bad response and shows login options', async () => {
		// Mock bad response
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
		});

		render(<AuthButton />);

		// Wait for error handling
		await waitFor(() => {
			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toBeInTheDocument();
		});
	});
});
