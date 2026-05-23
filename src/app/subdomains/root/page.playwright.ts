import { expect, test } from '@playwright/test';

import { pathToURLTestsOnly } from '~/lib/utils';

const pathToThisFile = import.meta.url;

const pageUrl = pathToURLTestsOnly(pathToThisFile);

test('homepage loads healthily', async ({ page }) => {
	// Navigate to the page and wait for it to load
	await page.goto(pageUrl, { waitUntil: 'networkidle' });

	// Wait a bit for any client-side hydration
	await page.waitForTimeout(2000);

	await expect(page.getByRole('heading', { name: /Kevin Porter/i })).toBeVisible();
	await expect(page.getByText('Featured Projects')).toBeVisible();
});
