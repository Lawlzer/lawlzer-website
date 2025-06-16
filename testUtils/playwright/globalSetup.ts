// import type { FullConfig } from '@playwright/test'; // No longer needed for project dependency approach
import type { FullConfig } from '@playwright/test';
import { expect } from '@playwright/test'; // Import test as setup
import dotenv from 'dotenv';
import path from 'path';

async function checkServerRunning(url: string): Promise<boolean> {
	try {
		const response = await fetch(url);
		return response.ok;
	} catch (error) {
		return false;
	}
}

async function globalSetup(_config: FullConfig): Promise<void> {
	const envPath = path.resolve(process.cwd(), '.test.env');
	dotenv.config({ path: envPath });
	expect(process.env.NEXT_PUBLIC_FRONTEND_PORT).toBeDefined();
	expect(process.env.NEXT_PUBLIC_SCHEME).toBeDefined();

	// Check if server is running
	const baseURL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://dev.localhost:3000';
	const isServerRunning = await checkServerRunning(baseURL);

	if (!isServerRunning) {
		console.error(`\n❌ E2E Tests Error: Server is not running at ${baseURL}`);
		console.error('Please start the development server before running e2e tests:');
		console.error('  npm run dev');
		console.error('\nThen in another terminal, run:');
		console.error('  npm run test:e2e\n');
		throw new Error(`Server is not running at ${baseURL}`);
	}

	console.info(`✅ Server is running at ${baseURL}`);
}

export default globalSetup;
