// Load environment variables before anything else
import './testUtils/playwright/loadEnv';

import { defineConfig, devices } from '@playwright/test';

import { getBaseUrl } from './src/lib/utils';

export default defineConfig({
	testDir: './src', // Directory where tests are located
	testMatch: '**/*.playwright.ts', // Match only files ending in .playwright.ts
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { open: 'never', outputFolder: './coverage/playwright-report' }]],
	timeout: 10000,
	expect: {
		timeout: 10000,
	},
	globalSetup: './testUtils/playwright/globalSetup.ts',
	globalTeardown: undefined,
	globalTimeout: 60 * 60 * 1000,
	grep: undefined,
	grepInvert: undefined,
	maxFailures: 0,
	outputDir: './coverage/playwright',
	quiet: false,
	reportSlowTests: { max: 5, threshold: 15000 },
	shard: null,
	updateSnapshots: 'missing',
	metadata: {},
	use: {
		baseURL: 'http://localhost:3005', // Base URL for the tests
		trace: 'on-first-retry',
		headless: true,
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: false,
		// Automatically capture artifacts on failure
		// video: 'retain-on-failure',
		// screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'next dev --turbo -p 3005', // Command to start the dev server
		url: 'http://localhost:3005',
		reuseExistingServer: !process.env.CI,
		timeout: 10000,
	},
});
