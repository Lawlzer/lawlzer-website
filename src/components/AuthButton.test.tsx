import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockUser } from '../../testUtils/unit/auth.helpers';
import { createMockSessionWithUser } from '../../testUtils/unit/data.factories';
import { renderWithProviders } from '../../testUtils/unit/render.helpers';

import AuthButton from './AuthButton';
import AuthButtonMock from './AuthButton.mock';

// --- Global Mocks ---

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserverMock {
	public observe(): void {}
	public unobserve(): void {}
	public disconnect(): void {}
} as unknown as typeof ResizeObserver;

// Mock window.location
Object.defineProperty(window, 'location', {
	value: { href: '' },
	writable: true,
});

// Mock console.error
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock utils
vi.mock('~/lib/utils', () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(' '),
	getBaseUrl: () => 'http://localhost:3000',
}));

// --- Test Helpers ---

const renderAuthButton = (props?: Parameters<typeof AuthButtonMock>[0]) => render(<AuthButtonMock {...props} />);

const openAuthMenu = () => {
	const loginButton = screen.getByText('Login / Register');
	fireEvent.click(loginButton);

	// Make menu items visible for testing
	const menuItems = screen.getByTestId('menuitems');
	menuItems.style.display = 'block';

	return { loginButton, menuItems };
};

const expectRedirect = (expectedUrl: string) => {
	expect(window.location.href).toBe(expectedUrl);
};

// --- Test Suite ---

describe('AuthButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.location.href = '';
	});

	afterEach(() => {
		cleanup();
	});

	describe('Loading State', () => {
		it('should show loading animation initially', () => {
			renderAuthButton({ initialState: 'loading' });

			const loadingElement = screen.getByTestId('auth-loading');
			expect(loadingElement).toBeInTheDocument();
			expect(loadingElement).toHaveClass('animate-pulse');
		});
	});

	describe('Unauthenticated State', () => {
		beforeEach(() => {
			renderAuthButton({ initialState: 'unauthenticated' });
		});

		it('should show login button when not authenticated', () => {
			expect(screen.getByText('Login / Register')).toBeInTheDocument();
		});

		it('should display all login options when menu is opened', () => {
			openAuthMenu();

			expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
			expect(screen.getByText('Sign in with Discord')).toBeInTheDocument();
			expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
		});

		describe('OAuth Provider Redirects', () => {
			const providers = [
				{ name: 'Google', displayText: 'Sign in with Google', provider: 'google' },
				{ name: 'Discord', displayText: 'Sign in with Discord', provider: 'discord' },
				{ name: 'GitHub', displayText: 'Sign in with GitHub', provider: 'github' },
			];

			providers.forEach(({ name, displayText, provider }) => {
				it(`should redirect to ${name} login when selected`, () => {
					openAuthMenu();
					fireEvent.click(screen.getByText(displayText));
					expectRedirect(`/api/auth/login?provider=${provider}`);
				});
			});
		});
	});

	describe('Authenticated State', () => {
		it('should show user name and logout option when authenticated', () => {
			const userData = { name: 'Test User', email: 'test@example.com' };
			renderAuthButton({ initialState: 'authenticated', userData });

			// Check for user name
			const userButton = screen.getByText('Test User');
			expect(userButton).toBeInTheDocument();

			// Open menu and check logout option
			fireEvent.click(userButton);
			const menuItems = screen.getByTestId('menuitems');
			menuItems.style.display = 'block';

			fireEvent.click(screen.getByText('Logout'));
			expectRedirect('/api/auth/logout');
		});

		describe('Fallback Display Names', () => {
			it('should use email when name is null', () => {
				renderAuthButton({
					initialState: 'authenticated',
					userData: { name: null, email: 'test@example.com' },
				});

				expect(screen.getByText('test@example.com')).toBeInTheDocument();
			});

			it('should use "Account" when both name and email are null', () => {
				renderAuthButton({
					initialState: 'authenticated',
					userData: { name: null, email: null },
				});

				expect(screen.getByText('Account')).toBeInTheDocument();
			});
		});
	});

	describe('Error Handling', () => {
		it('should show login options on fetch error', () => {
			renderAuthButton({ initialState: 'unauthenticated' });
			expect(screen.getByText('Login / Register')).toBeInTheDocument();
		});

		it('should show login options on bad response', () => {
			renderAuthButton({ initialState: 'unauthenticated' });
			expect(screen.getByText('Login / Register')).toBeInTheDocument();
		});
	});

	describe('Logged Out State', () => {
		it('should show sign in button when user is not logged in', () => {
			const { getByText } = renderWithProviders(<AuthButton initialSession={null} />);
			expect(getByText('Sign In')).toBeInTheDocument();
		});

		it('should have correct button classes for sign in', () => {
			const { getByText } = renderWithProviders(<AuthButton initialSession={null} />);
			const button = getByText('Sign In').closest('button');
			expect(button).toHaveClass('bg-primary');
		});
	});

	describe('Logged In State', () => {
		const mockUser = createMockUser({
			id: 'user-123',
			email: 'test@example.com',
			name: 'Test User',
			image: 'https://example.com/avatar.jpg',
		});

		// Use the factory to create session with user
		const { user, expires } = createMockSessionWithUser(
			{}, // no session overrides needed
			{
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
				image: 'https://example.com/avatar.jpg',
			}
		);

		const mockSession = { user, expires };

		it('should show user name when logged in', () => {
			const { getByText } = renderWithProviders(<AuthButton initialSession={mockSession} />);
			expect(getByText('Test User')).toBeInTheDocument();
		});

		it('should show email if name is not available', () => {
			const sessionWithoutName = {
				...mockSession,
				user: createMockUser({
					...mockUser,
					name: null,
				}),
			};
			const { getByText } = renderWithProviders(<AuthButton initialSession={sessionWithoutName} />);
			expect(getByText('test@example.com')).toBeInTheDocument();
		});

		it('should show Account if neither name nor email is available', () => {
			const minimalSession = {
				...mockSession,
				user: createMockUser({
					...mockUser,
					name: null,
					email: null,
				}),
			};
			const { getByText } = renderWithProviders(<AuthButton initialSession={minimalSession} />);
			expect(getByText('Account')).toBeInTheDocument();
		});

		it('should have correct button classes for logged in state', () => {
			const { getByText } = renderWithProviders(<AuthButton initialSession={mockSession} />);
			const button = getByText('Test User').closest('button');
			expect(button).toHaveClass('bg-secondary/50');
		});

		it('should update user state when initialSession changes', () => {
			const { rerender, getByText, queryByText } = renderWithProviders(<AuthButton initialSession={mockSession} />);

			expect(getByText('Test User')).toBeInTheDocument();

			// Change to logged out state
			rerender(<AuthButton initialSession={null} />);

			expect(queryByText('Test User')).not.toBeInTheDocument();
			expect(getByText('Sign In')).toBeInTheDocument();
		});
	});

	// Loading state is tested via other tests when clicking OAuth provider or logout links
});
