import { expect, test } from '@playwright/test';

import { cleanupTestUserAndSession, seedTestUserAndSession } from '../../testUtils/playwright/utils';

test.describe('Navigation Flow', () => {
	test.beforeEach(async () => {
		// Ensure clean state before each test
		await cleanupTestUserAndSession();
	});

	test.afterEach(async () => {
		// Clean up after each test
		await cleanupTestUserAndSession();
	});

	test('should navigate between pages while maintaining authentication', async ({ page, context }) => {
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

		// Start at homepage
		await page.goto('/');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Navigate to Valorant
		await page.getByRole('link', { name: /valorant/i }).click();
		await expect(page).toHaveURL('/valorant');

		// Verify Valorant page loaded and user still authenticated
		await expect(page.locator('svg.max-h-full').first()).toBeVisible({ timeout: 20000 });
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Navigate back to home
		await page.getByRole('link', { name: /home/i }).click();
		await expect(page).toHaveURL('/');

		// Verify still authenticated
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
	});

	test('should handle protected routes correctly', async ({ page }) => {
		// Try to access a protected route without authentication
		await page.goto('/dashboard');

		// Should be redirected to login
		await expect(page).toHaveURL(/\/api\/auth\/login/);
	});

	test('should have working navigation menu', async ({ page }) => {
		await page.goto('/');

		// Check navigation links exist
		await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /valorant/i })).toBeVisible();

		// Test navigation to Valorant
		await page.getByRole('link', { name: /valorant/i }).click();
		await expect(page).toHaveURL('/valorant');

		// Test navigation back to home
		await page.getByRole('link', { name: /home/i }).click();
		await expect(page).toHaveURL('/');
	});

	test('should handle mobile navigation menu', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		await page.goto('/');

		// Mobile menu button should be visible
		const mobileMenuButton = page.getByRole('button', { name: /menu/i });
		await expect(mobileMenuButton).toBeVisible();

		// Click to open mobile menu
		await mobileMenuButton.click();

		// Navigation links should be visible in mobile menu
		await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /valorant/i })).toBeVisible();

		// Navigate to Valorant from mobile menu
		await page.getByRole('link', { name: /valorant/i }).click();
		await expect(page).toHaveURL('/valorant');
	});

	test('should preserve authentication state across browser refresh', async ({ page, context }) => {
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
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Hard refresh (Ctrl+F5)
		await page.reload({ waitUntil: 'networkidle' });

		// Should still be authenticated
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();

		// Navigate to another page and refresh there
		await page.goto('/valorant');
		await page.reload({ waitUntil: 'networkidle' });

		// Should still be authenticated on different page
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
	});

	test('should show correct user menu options when authenticated', async ({ page, context }) => {
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

		await page.goto('/');

		// Click user menu
		await page.getByRole('button', { name: /test e2e user/i }).click();

		// Check menu items
		await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /log out/i })).toBeVisible();

		// Close menu by clicking outside
		await page.click('body');

		// Menu should be closed
		await expect(page.getByRole('menuitem', { name: /log out/i })).not.toBeVisible();
	});
});
