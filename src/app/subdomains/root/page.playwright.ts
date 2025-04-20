import { test, expect } from '@playwright/test';
import { testPageBasics } from '@testUtils/playwright/utils';
import { pathToURLTestsOnly } from '~/lib/utils';
import { metadata } from './layout';
const pathToThisFile = import.meta.url;

const pageUrl = pathToURLTestsOnly(pathToThisFile);

test('homepage loads healthily', async ({ page }) => {
	await testPageBasics(page, pageUrl, metadata, {});
});
