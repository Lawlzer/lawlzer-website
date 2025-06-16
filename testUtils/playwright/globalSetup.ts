// import type { FullConfig } from '@playwright/test'; // No longer needed for project dependency approach
import type { FullConfig } from '@playwright/test';
import { expect } from '@playwright/test'; // Import test as setup
import dotenv from 'dotenv';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';

let devServerProcess: ChildProcess | null = null;

async function checkServerRunning(url: string, maxAttempts = 1): Promise<boolean> {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(url);
			if (response.ok) return true;
		} catch (error) {
			// Server not ready yet
		}
		if (i < maxAttempts - 1) {
			await new Promise<void>(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
		}
	}
	return false;
}

async function startDevServer(): Promise<void> {
	console.info('🚀 Starting development server...');
	
	devServerProcess = spawn('npm', ['run', 'dev'], {
		stdio: 'pipe',
		shell: true,
		env: {
			...process.env,
			SKIP_ENV_VALIDATION: 'true',
			CI: 'true',
			NEXT_PUBLIC_SCHEME: 'http',
			NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: 'dev',
			NEXT_PUBLIC_TOP_LEVEL_DOMAIN: 'localhost',
			NEXT_PUBLIC_FRONTEND_PORT: '3000',
			NEXT_PUBLIC_AUTH_GOOGLE_ID: 'dummy-google-id',
			NEXT_PUBLIC_AUTH_DISCORD_ID: 'dummy-discord-id',
			NEXT_PUBLIC_AUTH_GITHUB_ID: 'dummy-github-id',
			DATABASE_URL: 'mongodb://localhost:27017/lawlzer?replicaSet=rs0',
			AUTH_GOOGLE_SECRET: 'dummy-google-secret',
			AUTH_DISCORD_SECRET: 'dummy-discord-secret',
			AUTH_GITHUB_SECRET: 'dummy-github-secret',
		}
	});

	// Capture server output for debugging
	devServerProcess.stdout?.on('data', (data: Buffer) => {
		console.info(`[dev-server] ${data.toString().trim()}`);
	});

	devServerProcess.stderr?.on('data', (data: Buffer) => {
		console.error(`[dev-server-error] ${data.toString().trim()}`);
	});

	devServerProcess.on('error', (error: Error) => {
		console.error('Failed to start dev server:', error);
		throw error;
	});
}

async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
	const envPath = path.resolve(process.cwd(), '.test.env');
	dotenv.config({ path: envPath });
	expect(process.env.NEXT_PUBLIC_FRONTEND_PORT).toBeDefined();
	expect(process.env.NEXT_PUBLIC_SCHEME).toBeDefined();

	// Check if server is running
	const baseURL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://dev.localhost:3000';
	let isServerRunning = await checkServerRunning(baseURL);

	if (!isServerRunning) {
		console.info(`📡 No server detected at ${baseURL}, starting one automatically...`);
		
		// Start the dev server
		await startDevServer();
		
		// Wait for server to be ready (up to 60 seconds)
		console.info('⏳ Waiting for server to be ready...');
		isServerRunning = await checkServerRunning(baseURL, 60);
		
		if (!isServerRunning) {
			throw new Error(`Failed to start dev server at ${baseURL} after 60 seconds`);
		}
	} else {
		console.info(`✅ Using existing server at ${baseURL}`);
	}

	console.info(`✅ Server is ready at ${baseURL}`);
	
	// Return a teardown function
	return async () => {
		if (devServerProcess) {
			console.info('🛑 Stopping dev server...');
			devServerProcess.kill();
			// Give it time to shutdown gracefully
			await new Promise<void>(resolve => setTimeout(resolve, 1000));
		}
	};
}

export default globalSetup;
