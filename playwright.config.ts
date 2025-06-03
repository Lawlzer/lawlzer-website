// Load environment variables before anything else
// import './testUtils/playwright/loadEnv';

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Define the path to the global setup file
const __dirname = path.resolve();
const globalSetupPath = path.resolve(__dirname, 'testUtils', 'playwright', 'globalSetup.ts');

export default defineConfig({
	testDir: './src', // Directory where tests are located
	testMatch: '**/*.playwright.ts', // Match only files ending in .playwright.ts
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI !== undefined ? 2 : 0,
	workers: process.env.CI !== undefined ? 1 : undefined,
	reporter: [['html', { open: 'never', outputFolder: './coverage/playwright-report' }]],
	timeout: 10000,
	expect: {
		timeout: 10000,
	},
	globalSetup: globalSetupPath,
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
		baseURL: process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:3000',
		trace: Boolean(process.env.CI) ? 'retain-on-failure' : 'on',
		headless: true,
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: false,
		// Automatically capture artifacts on failure
		// video: 'retain-on-failure',
		// screenshot: 'only-on-failure',
	},
	projects: [
		...(Boolean(process.env.GITHUB_ACTIONS)
			? []
			: [
					{
						name: 'chromium',
						use: { ...devices['Desktop Chrome'] },
						dependencies: [],
					},
					{
						name: 'Google Chrome',
						use: { channel: 'chrome' },
						...(Boolean(process.env.CI) ? { retries: 2 } : {}),
					},
					...(process.env.PLAYWRIGHT_SAFARI === 'true'
						? [
								{
									name: 'Safari',
									use: { ...devices['Desktop Safari'] },
								},
							]
						: []),
					...(process.env.PLAYWRIGHT_FIREFOX === 'true'
						? [
								{
									name: 'Firefox',
									use: { ...devices['Desktop Firefox'] },
								},
							]
						: []),
					...(process.env.PLAYWRIGHT_MOBILE === 'true'
						? [
								{
									name: 'Mobile Chrome',
									use: { ...devices['Pixel 5'] },
								},
								{
									name: 'Mobile Safari',
									use: { ...devices['iPhone 12'] },
								},
							]
						: []),
				]),
	],
	webServer: [
		{
			command: process.env.PLAYWRIGHT_BACKEND_URL !== undefined && process.env.PLAYWRIGHT_BACKEND_URL.trim() !== '' ? '' : 'npm run dev',
			url: process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:3000',
		},
		...(Boolean(process.env.GITHUB_ACTIONS) || Boolean(process.env.CI)
			? []
			: [
					{
						command: process.env.PLAYWRIGHT_DATABASE_URL !== undefined && process.env.PLAYWRIGHT_DATABASE_URL.trim() !== '' ? '' : 'docker-compose up database -d',
						url: process.env.PLAYWRIGHT_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/site',
					},
				]),
	],
});
