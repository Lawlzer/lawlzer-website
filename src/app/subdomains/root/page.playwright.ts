import { test, expect } from '@playwright/test';
import { testPageBasics } from '@testUtils/playwright/utils';
import { pathToURLTestsOnly } from '~/lib/utils';
const pathToThisFile = import.meta.url;

const metadata = {
	title: 'Home',
	description: 'Home page',
};

const pageUrl = pathToURLTestsOnly(pathToThisFile);

test('homepage loads healthily', async ({ page }) => {
	// await testPageBasics(page, pageUrl, metadata, {});
});
