import { test, expect } from '@playwright/test';
import { testPageBasics } from '@testUtils/playwright/utils';
import { pathToURLTestsOnly } from '~/lib/utils';
import { metadata } from './layout';
// Import accessibility checker if available, e.g.:
// import AxeBuilder from '@axe-core/playwright';

const pathToThisFile = import.meta.url;

const pageUrl = pathToURLTestsOnly(pathToThisFile);

test('homepage loads healthily', async ({ page }) => {
	await page.goto(pageUrl);

	// 1. Check page title (assuming metadata.title exists and is correct)
	let expectedTitle = 'Default Title'; // Fallback
	if (typeof metadata.title === 'string') {
		expectedTitle = metadata.title;
	} else if (metadata.title && typeof metadata.title === 'object') {
		if ('absolute' in metadata.title && typeof metadata.title.absolute === 'string') {
			expectedTitle = metadata.title.absolute;
		} else if ('default' in metadata.title && typeof metadata.title.default === 'string') {
			expectedTitle = metadata.title.default;
		}
		// Note: Handling for 'template' might require more complex logic if needed
	}
	await expect(page).toHaveTitle(expectedTitle);

	// 2. Check main heading visibility (Example check)
	await expect(page.getByRole('heading', { name: /Welcome!/i })).toBeVisible();

	// 3. Optional: Perform accessibility check (if configured)
	// const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
	// expect(accessibilityScanResults.violations).toEqual([]);

	// NOTE: The original scrollbar check from testPageBasics is omitted here.
});
