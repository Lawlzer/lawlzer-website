import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';
import type { Session } from 'next-auth'; // Assuming Session type might be needed

// Mock dependencies
jest.mock('~/server/auth', () => ({
	auth: jest.fn().mockResolvedValue(null as Session | null), // Mock as logged out initially
}));

jest.mock('~/trpc/server', () => ({
	api: {
		post: {
			hello: jest.fn().mockResolvedValue({ greeting: 'Mocked Greeting' }),
			getLatest: {
				prefetch: jest.fn().mockResolvedValue(undefined),
			},
		},
	},
	HydrateClient: jest.fn(({ children }) => <>{children}</>), // Mock HydrateClient as a simple fragment
}));

// Mock the LatestPost component if it's used and needs mocking
jest.mock('~/app/_components/post', () => ({
	LatestPost: jest.fn(() => <div>Mocked Latest Post</div>),
}));

describe('Home Page', () => {
	it('renders the main heading', async () => {
		// Render the component. Since it's async, we need to handle the promise.
		const HomeResolved = await Home();
		render(HomeResolved);

		// Check if the main heading is present
		// Use findBy* or waitFor for elements that might appear asynchronously
		// Although in this mocked scenario, it might render synchronously after await Home()
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: /Create T3 App/i })).toBeInTheDocument();
		});

		// Optionally, check for mocked content
		await waitFor(() => {
			expect(screen.getByText('Mocked Greeting')).toBeInTheDocument();
		});

		// Check for sign-in button when logged out
		await waitFor(() => {
			expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
		});
	});

	it('shows user name and sign out when logged in', async () => {
		// Mock as logged in for this test
		const mockSession: Session = {
			user: { id: '1', name: 'Test User', email: 'test@example.com' },
			expires: 'some-future-date',
		};
		// Correctly access the mocked module to change its behavior for this test
		jest.requireMock('~/server/auth').auth.mockResolvedValue(mockSession);

		const HomeResolved = await Home();
		render(HomeResolved);

		// Check for user name
		await waitFor(() => {
			expect(screen.getByText(/Logged in as Test User/i)).toBeInTheDocument();
		});

		// Check for sign out button
		await waitFor(() => {
			expect(screen.getByRole('link', { name: /Sign out/i })).toBeInTheDocument();
		});

		// Check if LatestPost is rendered (or its mock)
		await waitFor(() => {
			expect(screen.getByText('Mocked Latest Post')).toBeInTheDocument();
		});
	});
});
