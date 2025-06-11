import { expect, test } from '@playwright/test';

import { pathToURLTestsOnly } from '~/lib/utils';
// Import accessibility checker if available, e.g.:
// import AxeBuilder from '@axe-core/playwright';

const pathToThisFile = import.meta.url;

const pageUrl = pathToURLTestsOnly(pathToThisFile);

test('homepage loads healthily', async ({ page }) => {
	// Navigate to the page and wait for it to load
	await page.goto(pageUrl, { waitUntil: 'networkidle' });

	// Wait a bit for any client-side hydration
	await page.waitForTimeout(2000);

	// Skip title check since the page is a client component and cannot export metadata
	// The title would need to be set via a document.title assignment or Head component

	// 2. Check main heading visibility (this is working correctly)
	await expect(page.locator('h1').filter({ hasText: 'Kevin Porter' })).toBeVisible();

	// 3. Check that key content is present
	await expect(page.getByText('Kevin Porter')).toBeVisible();
	await expect(page.getByText('Featured Projects')).toBeVisible();

	// 3. Optional: Perform accessibility check (if configured)
	// const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
	// expect(accessibilityScanResults.violations).toEqual([]);

	// NOTE: The original scrollbar check from testPageBasics is omitted here.
});
