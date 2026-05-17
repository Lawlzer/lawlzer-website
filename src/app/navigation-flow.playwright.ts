import { expect, test } from '@playwright/test';

import { cleanupTestUserAndSession, seedTestUserAndSession } from '../../testUtils/playwright/utils';

test.describe('Navigation Flow - Basic', () => {
	test('should handle protected routes correctly', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/api\/auth\/login/);
	});

	test('should have working navigation menu', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /valorant/i })).toBeVisible();
		await page.getByRole('link', { name: /valorant/i }).click();
		await expect(page).toHaveURL('/valorant');
		await page.getByRole('link', { name: /home/i }).click();
		await expect(page).toHaveURL('/');
	});

	test('should handle mobile navigation menu', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		const mobileMenuButton = page.getByRole('button', { name: /menu/i });
		await expect(mobileMenuButton).toBeVisible();
		await mobileMenuButton.click();
		await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /valorant/i })).toBeVisible();
		await page.getByRole('link', { name: /valorant/i }).click();
		await expect(page).toHaveURL('/valorant');
	});
});

test.describe('Navigation Flow - Authenticated', () => {
	test.beforeEach(async () => {
		await cleanupTestUserAndSession();
	});

	test.afterEach(async () => {
		await cleanupTestUserAndSession();
	});

	test('should navigate between pages while maintaining authentication', async ({ page, context }) => {
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.getByRole('link', { name: /valorant/i }).click();
		await expect(page).toHaveURL('/valorant');
		await expect(page.locator('svg.max-h-full').first()).toBeVisible({ timeout: 20000 });
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.getByRole('link', { name: /home/i }).click();
		await expect(page).toHaveURL('/');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
	});

	test('should preserve authentication state across browser refresh', async ({ page, context }) => {
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.reload({ waitUntil: 'networkidle' });
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.goto('/valorant');
		await page.reload({ waitUntil: 'networkidle' });
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
	});

	test('should show correct user menu options when authenticated', async ({ page, context }) => {
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/');
		await page.getByRole('button', { name: /test e2e user/i }).click();
		await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /log out/i })).toBeVisible();
		await page.click('body');
		await expect(page.getByRole('menuitem', { name: /log out/i })).not.toBeVisible();
	});
});
