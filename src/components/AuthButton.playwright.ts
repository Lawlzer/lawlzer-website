import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper function to simulate a successful authentication
async function mockAuthSession(page: Page, user = { id: 'mock-user-id', name: 'Test User', email: 'test@example.com' }): Promise<void> {
	await page.route('**/api/auth/session', async (route) => {
		await route.fulfill({
			status: 200,
			body: JSON.stringify({
				user,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day from now
			}),
			headers: { 'Content-Type': 'application/json' },
		});
	});
}

// Helper function to simulate a logged-out state
async function mockLoggedOutSession(page: Page): Promise<void> {
	await page.route('**/api/auth/session', async (route) => {
		await route.fulfill({
			status: 200,
			body: JSON.stringify(null),
			headers: { 'Content-Type': 'application/json' },
		});
	});
}

test.describe('Authentication Redirect Flow', () => {
	test('redirects back to original page after login', async ({ page, context }) => {
		// Clear all cookies to ensure we're in a clean state
		await context.clearCookies();

		// Start by navigating to a specific page
		const startPage = '/subdomains/root/about';
		await page.goto(startPage);
		await page.waitForLoadState('networkidle');

		// Ensure we appear logged out
		await mockLoggedOutSession(page);
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify we're on the right page
		expect(page.url()).toContain(startPage);

		// Store the current URL
		const currentUrl = page.url();

		// Set up the auth_redirect cookie with the current page URL
		await context.addCookies([
			{
				name: 'auth_redirect',
				value: currentUrl,
				domain: 'localhost',
				path: '/',
			},
		]);

		// Set up auth callback route to handle redirect
		await page.route('**/api/auth/callback/**', async (route) => {
			const cookies = await context.cookies();
			const redirectCookie = cookies.find((c) => c.name === 'auth_redirect');

			// Set a session cookie to simulate logged-in state
			await context.addCookies([
				{
					name: 'session_token',
					value: 'test-session-token-' + Date.now(),
					domain: 'localhost',
					path: '/',
					httpOnly: true,
				},
			]);

			// Redirect to the stored URL or home
			await route.fulfill({
				status: 302,
				headers: {
					location: redirectCookie ? redirectCookie.value : '/',
				},
			});
		});

		// Simulate auth callback navigation
		await page.goto('/api/auth/callback/google?code=test-code&state=test-state');

		// Set up the session to show logged in
		await mockAuthSession(page);

		// Check if we redirected back to the original page
		expect(page.url()).toContain(startPage);

		// Reload the page to ensure the session state is refreshed
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Check for the logged-in user name
		await expect(page.getByText('Test User')).toBeVisible();
	});
});
