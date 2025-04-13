import { test, expect } from '@playwright/test';
import { metadata } from './page';
import { testPageBasics } from '@testUtils/playwright';
import { pathToURLTestsOnly } from '~/lib/utils';
const pathToThisFile = import.meta.url;

const pageUrl = pathToURLTestsOnly(pathToThisFile);

test('homepage loads healthily', async ({ page }) => {
	await testPageBasics(page, pageUrl, metadata, {});
});
