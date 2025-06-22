import { expect, test } from '@playwright/test';

import { cleanupTestUserAndSession, seedTestUserAndSession } from '../../../../testUtils/playwright/utils';

test.describe('Authentication Flow', () => {
	test.beforeEach(async () => {
		// Ensure clean state before each test
		await cleanupTestUserAndSession();
	});

	test.afterEach(async () => {
		// Clean up after each test
		await cleanupTestUserAndSession();
	});

	test('should show login options on homepage when not authenticated', async ({ page }) => {
		await page.goto('/');

		// Check for login buttons
		await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();

		// Navigate to login page
		await page.getByRole('link', { name: /sign in/i }).click();
		await expect(page).toHaveURL('/api/auth/login');

		// Check for OAuth provider buttons
		await expect(page.getByRole('button', { name: /discord/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
	});

	test('should show user info when authenticated', async ({ page, context }) => {
		// Seed test user and session
		const { sessionToken } = await seedTestUserAndSession();

		// Set session cookie
		await context.addCookies([
			{
				name: 'authjs.session-token',
				value: sessionToken,
				domain: 'localhost',
				path: '/',
				httpOnly: true,
				secure: false,
				sameSite: 'Lax',
			},
		]);

		// Navigate to homepage
		await page.goto('/');

		// Should see user menu instead of login
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Click user menu
		await page.getByRole('button', { name: /test e2e user/i }).click();

		// Should see logout option
		await expect(page.getByRole('menuitem', { name: /log out/i })).toBeVisible();
	});

	test('should handle logout flow', async ({ page, context }) => {
		// Seed test user and session
		const { sessionToken } = await seedTestUserAndSession();

		// Set session cookie
		await context.addCookies([
			{
				name: 'authjs.session-token',
				value: sessionToken,
				domain: 'localhost',
				path: '/',
				httpOnly: true,
				secure: false,
				sameSite: 'Lax',
			},
		]);

		// Navigate to homepage
		await page.goto('/');

		// Click user menu
		await page.getByRole('button', { name: /test e2e user/i }).click();

		// Click logout
		await page.getByRole('menuitem', { name: /log out/i }).click();

		// Should be redirected to logout route
		await expect(page).toHaveURL('/api/auth/logout');

		// Should be redirected back to homepage
		await page.waitForURL('/');

		// Should see login button again
		await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();

		// Session cookie should be cleared
		const cookies = await context.cookies();
		const sessionCookie = cookies.find((c) => c.name === 'authjs.session-token');
		expect(sessionCookie).toBeUndefined();
	});

	test('should redirect to requested page after login', async ({ page, context }) => {
		// Try to access protected page
		await page.goto('/dashboard');

		// Should be redirected to login
		await expect(page).toHaveURL(/\/api\/auth\/login/);

		// Now simulate successful login
		const { sessionToken } = await seedTestUserAndSession();

		await context.addCookies([
			{
				name: 'authjs.session-token',
				value: sessionToken,
				domain: 'localhost',
				path: '/',
				httpOnly: true,
				secure: false,
				sameSite: 'Lax',
			},
		]);

		// Navigate to dashboard again
		await page.goto('/dashboard');

		// Should now be able to access dashboard
		await expect(page).toHaveURL('/dashboard');
		await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
	});

	test('should persist session across page reloads', async ({ page, context }) => {
		// Seed test user and session
		const { sessionToken } = await seedTestUserAndSession();

		// Set session cookie
		await context.addCookies([
			{
				name: 'authjs.session-token',
				value: sessionToken,
				domain: 'localhost',
				path: '/',
				httpOnly: true,
				secure: false,
				sameSite: 'Lax',
			},
		]);

		// Navigate to homepage
		await page.goto('/');

		// Should see user menu
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Reload page
		await page.reload();

		// Should still see user menu
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Navigate to another page
		await page.goto('/valorant');

		// Should still be authenticated
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
	});
});
