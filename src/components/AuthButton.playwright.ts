import { expect, test } from '@playwright/test';

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
		await expect(page.getByRole('menuitem', { name: 'GitHub' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: 'Discord' })).toBeVisible();
	});
});
