'use client';

import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AuthErrorPage from './page';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
	default: ({ children, href, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

describe('AuthErrorPage Component', () => {
	const mockPush = vi.fn();
	const mockSearchParams = new URLSearchParams();

	beforeEach(() => {
		vi.clearAllMocks();
		(useRouter as any).mockReturnValue({ push: mockPush });
		(useSearchParams as any).mockReturnValue(mockSearchParams);
	});

	it('should render default error when no error code is provided', () => {
		render(React.createElement(AuthErrorPage));

		expect(screen.getByText('Authentication Error')).toBeInTheDocument();
		expect(screen.getByText('Something went wrong during the authentication process. Please try again.')).toBeInTheDocument();
	});

	it('should render invalid_state error correctly', () => {
		mockSearchParams.set('error', 'invalid_state');
		(useSearchParams as any).mockReturnValue(mockSearchParams);

		render(React.createElement(AuthErrorPage));

		expect(screen.getByText('Session Expired')).toBeInTheDocument();
		expect(screen.getByText('Your authentication session has expired or there was a security issue. Please try signing in again.')).toBeInTheDocument();
		expect(screen.getByText('Error Code: invalid_state')).toBeInTheDocument();
	});

	it('should render no_code error correctly', () => {
		mockSearchParams.set('error', 'no_code');
		(useSearchParams as any).mockReturnValue(mockSearchParams);

		render(React.createElement(AuthErrorPage));

		expect(screen.getByText('Authorization Failed')).toBeInTheDocument();
		expect(screen.getByText("We didn't receive the necessary authorization from your provider. Please try again.")).toBeInTheDocument();
		expect(screen.getByText('Error Code: no_code')).toBeInTheDocument();
	});

	it('should render server_error correctly', () => {
		mockSearchParams.set('error', 'server_error');
		(useSearchParams as any).mockReturnValue(mockSearchParams);

		render(React.createElement(AuthErrorPage));

		expect(screen.getByText('Server Error')).toBeInTheDocument();
		expect(screen.getByText('Our servers encountered an error. Please try again in a few moments.')).toBeInTheDocument();
		expect(screen.getByText('Error Code: server_error')).toBeInTheDocument();
	});

	it('should navigate to home when Try Again button is clicked', () => {
		render(React.createElement(AuthErrorPage));

		const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
		fireEvent.click(tryAgainButton);

		expect(mockPush).toHaveBeenCalledWith('/');
	});

	it('should have correct links', () => {
		render(React.createElement(AuthErrorPage));

		const homepageLink = screen.getByRole('link', { name: /Return to Homepage/i });
		expect(homepageLink).toHaveAttribute('href', '/');

		const contactLink = screen.getByRole('link', { name: /Contact Support/i });
		expect(contactLink).toHaveAttribute('href', '/contact');
	});

	it('should not show error code badge when error code is null', () => {
		mockSearchParams.delete('error');
		(useSearchParams as any).mockReturnValue(mockSearchParams);

		render(React.createElement(AuthErrorPage));

		expect(screen.queryByText(/Error Code:/)).not.toBeInTheDocument();
	});

	it('should render without errors when isClient is false', () => {
		// Test the initial server-side render state
		const { container } = render(React.createElement(AuthErrorPage));

		// Initially should show the loading div
		const loadingDiv = container.querySelector('.relative.flex.min-h-screen.items-center.justify-center.p-4');
		expect(loadingDiv).toBeInTheDocument();
	});
});
