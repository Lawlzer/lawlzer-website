import { expect, test } from '@playwright/test';

import { cleanupTestUserAndSession, seedTestUserAndSession } from '../../../../testUtils/playwright/utils';

test.describe('Authentication Flow - Login', () => {
	test.beforeEach(async () => {
		await cleanupTestUserAndSession();
	});

	test.afterEach(async () => {
		await cleanupTestUserAndSession();
	});

	test('should show login options on homepage when not authenticated', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
		await page.getByRole('link', { name: /sign in/i }).click();
		await expect(page).toHaveURL('/api/auth/login');
		await expect(page.getByRole('button', { name: /discord/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
	});

	test('should show user info when authenticated', async ({ page, context }) => {
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.getByRole('button', { name: /test e2e user/i }).click();
		await expect(page.getByRole('menuitem', { name: /log out/i })).toBeVisible();
	});

	test('should redirect to requested page after login', async ({ page, context }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/api\/auth\/login/);
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/dashboard');
		await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
	});
});

test.describe('Authentication Flow - Logout and Session', () => {
	test.beforeEach(async () => {
		await cleanupTestUserAndSession();
	});

	test.afterEach(async () => {
		await cleanupTestUserAndSession();
	});

	test('should handle logout flow', async ({ page, context }) => {
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/');
		await page.getByRole('button', { name: /test e2e user/i }).click();
		await page.getByRole('menuitem', { name: /log out/i }).click();
		await expect(page).toHaveURL('/api/auth/logout');
		await page.waitForURL('/');
		await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
		const cookies = await context.cookies();
		const sessionCookie = cookies.find((c) => c.name === 'authjs.session-token');
		expect(sessionCookie).toBeUndefined();
	});

	test('should persist session across page reloads', async ({ page, context }) => {
		const { sessionToken } = await seedTestUserAndSession();
		await context.addCookies([{ name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
		await page.goto('/');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.reload();
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
		await page.goto('/valorant');
		await expect(page.getByRole('button', { name: /test e2e user/i })).toBeVisible();
	});
});
