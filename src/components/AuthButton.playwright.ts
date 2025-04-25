import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { seedTestUserAndSession, cleanupTestUserAndSession } from '../../testUtils/playwright/utils';

// Helper function to set cookies for logged in state using a real session token
async function setupLoggedInState(page: Page, sessionToken: string): Promise<void> {
	// Set the custom session token cookie
	await page.context().addCookies([
		{
			name: 'session_token', // Use the correct cookie name
			value: sessionToken, // Use the actual session token from seeding
			domain: 'localhost',
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
		},
	]);

	// No need to mock /api/auth/session as getSession uses a different mechanism
}

test.describe('AuthButton', () => {
	test('shows login button when logged out', async ({ page }) => {
		// Go to homepage without any auth mocking (should be logged out by default)
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check if login button is visible
		const loginButton = page.getByRole('button', { name: /login/i });
		await expect(loginButton).toBeVisible();

		// Click button to see login options
		await loginButton.click();

		// Verify login options are shown
		await expect(page.getByText('Sign in with GitHub')).toBeVisible();
		await expect(page.getByText('Sign in with Discord')).toBeVisible();
	});
});

// Test suite for logged-in state using database seeding
test.describe('AuthButton with real session', () => {
	let sessionToken: string;

	// Seed data before each test in this describe block
	test.beforeEach(async () => {
		const seededData = await seedTestUserAndSession();
		sessionToken = seededData.sessionToken;
	});

	// Clean up data after each test
	test.afterEach(async () => {
		await cleanupTestUserAndSession();
	});
});
