import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

export default defineConfig({
	testDir: './src', // Directory where tests are located
	testMatch: '**/*.playwright.ts', // Match only files ending in .playwright.ts
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { open: 'never', outputFolder: './coverage/playwright-report' }]],
	timeout: 5000,
	expect: {
		timeout: 5000,
	},
	globalSetup: undefined,
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
		baseURL: 'http://localhost:3000', // Base URL for the tests
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
		command: 'npm run dev', // Command to start the dev server
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
	},
});
