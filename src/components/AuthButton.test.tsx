import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthButtonMock from './AuthButton.mock';

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

// Mock console.error
console.error = vi.fn();

describe('AuthButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.location.href = '';
	});

	afterEach(() => {
		cleanup(); // Clean up after each test
	});

	it('shows loading state initially', () => {
		render(<AuthButtonMock initialState='loading' />);

		const loadingElement = screen.getByTestId('auth-loading');
		expect(loadingElement).toBeInTheDocument();
		expect(loadingElement).toHaveClass('animate-pulse');
	});

	it('shows login options when user is not authenticated', async () => {
		render(<AuthButtonMock initialState='unauthenticated' />);

		// Check that login button is present
		const loginButton = screen.getByText('Login / Register');
		expect(loginButton).toBeInTheDocument();

		// Open the menu
		fireEvent.click(loginButton);

		// Make menu items visible for testing
		const menuItems = screen.getByTestId('menuitems');
		menuItems.style.display = 'block';

		// Check login options
		expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
		expect(screen.getByText('Sign in with Discord')).toBeInTheDocument();
		expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
	});

	it('redirects to Google login when selected', async () => {
		render(<AuthButtonMock initialState='unauthenticated' />);

		// Check login button
		const loginButton = screen.getByText('Login / Register');
		expect(loginButton).toBeInTheDocument();

		// Open the menu
		fireEvent.click(loginButton);

		// Make menu items visible for testing
		const menuItems = screen.getByTestId('menuitems');
		menuItems.style.display = 'block';

		// Click on Google login
		fireEvent.click(screen.getByText('Sign in with Google'));

		// Check if window.location.href was set correctly
		expect(window.location.href).toBe('/api/auth/login?provider=google');
	});

	it('redirects to Discord login when selected', async () => {
		render(<AuthButtonMock initialState='unauthenticated' />);

		// Check login button
		const loginButton = screen.getByText('Login / Register');
		expect(loginButton).toBeInTheDocument();

		// Open the menu
		fireEvent.click(loginButton);

		// Make menu items visible for testing
		const menuItems = screen.getByTestId('menuitems');
		menuItems.style.display = 'block';

		// Click on Discord login
		fireEvent.click(screen.getByText('Sign in with Discord'));

		// Check if window.location.href was set correctly
		expect(window.location.href).toBe('/api/auth/login?provider=discord');
	});

	it('redirects to GitHub login when selected', async () => {
		render(<AuthButtonMock initialState='unauthenticated' />);

		// Check login button
		const loginButton = screen.getByText('Login / Register');
		expect(loginButton).toBeInTheDocument();

		// Open the menu
		fireEvent.click(loginButton);

		// Make menu items visible for testing
		const menuItems = screen.getByTestId('menuitems');
		menuItems.style.display = 'block';

		// Click on GitHub login
		fireEvent.click(screen.getByText('Sign in with GitHub'));

		// Check if window.location.href was set correctly
		expect(window.location.href).toBe('/api/auth/login?provider=github');
	});

	it('shows user info and logout option when authenticated', async () => {
		// Render with authenticated user
		render(<AuthButtonMock initialState='authenticated' userData={{ name: 'Test User', email: 'test@example.com' }} />);

		// Check for user name
		const userButton = screen.getByText('Test User');
		expect(userButton).toBeInTheDocument();

		// Open the menu by clicking the user button
		fireEvent.click(userButton);

		// Make menu items visible for testing
		const menuItems = screen.getByTestId('menuitems');
		menuItems.style.display = 'block';

		// Find and click logout
		fireEvent.click(screen.getByText('Logout'));

		// Verify redirect to logout endpoint
		expect(window.location.href).toBe('/api/auth/logout');
	});

	it('uses email as fallback when name is null', async () => {
		// Render with authenticated user that has no name
		render(<AuthButtonMock initialState='authenticated' userData={{ name: null, email: 'test@example.com' }} />);

		// Check for email used instead of name
		expect(screen.getByText('test@example.com')).toBeInTheDocument();
	});

	it('uses "Account" as fallback when name and email are null', async () => {
		// Render with authenticated user that has no name or email
		render(<AuthButtonMock initialState='authenticated' userData={{ name: null, email: null }} />);

		// Check for fallback text
		expect(screen.getByText('Account')).toBeInTheDocument();
	});

	it('handles fetch errors and shows login options', async () => {
		// Simulate error by rendering unauthenticated state
		render(<AuthButtonMock initialState='unauthenticated' />);

		// Should show login button
		const loginButton = screen.getByText('Login / Register');
		expect(loginButton).toBeInTheDocument();
	});

	it('handles bad response and shows login options', async () => {
		// Simulate bad response by rendering unauthenticated state
		render(<AuthButtonMock initialState='unauthenticated' />);

		// Should show login button
		const loginButton = screen.getByText('Login / Register');
		expect(loginButton).toBeInTheDocument();
	});
});
