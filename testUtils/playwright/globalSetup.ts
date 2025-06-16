// import type { FullConfig } from '@playwright/test'; // No longer needed for project dependency approach
import type { FullConfig } from '@playwright/test';
import { expect } from '@playwright/test'; // Import test as setup
import { type ChildProcess, spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

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
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 1000);
			}); // Wait 1 second between attempts
		}
	}
	return false;
}

async function killProcessTree(pid: number): Promise<void> {
	try {
		if (process.platform === 'win32') {
			// On Windows, use taskkill to kill the process tree
			const { exec } = await import('child_process');
			await new Promise<void>((resolve, reject) => {
				exec(`taskkill /pid ${pid} /T /F`, (error) => {
					if (error && !error.message.includes('not found')) {
						reject(error);
					} else {
						resolve();
					}
				});
			});
		} else {
			// On Unix-like systems, kill the process group
			process.kill(-pid, 'SIGTERM');
			// Give it a moment to terminate gracefully
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 100);
			});
			// Force kill if still running
			try {
				process.kill(-pid, 'SIGKILL');
			} catch (e) {
				// Process might already be dead
			}
		}
	} catch (error) {
		console.error('Error killing process tree:', error);
	}
}

async function startDevServer(): Promise<void> {
	console.info('🚀 Starting development server...');

	devServerProcess = spawn('npm', ['run', 'dev'], {
		stdio: 'pipe',
		shell: true,
		// Create a new process group
		detached: process.platform !== 'win32',
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
		},
	});

	// Capture server output for debugging
	devServerProcess.stdout?.on('data', (data: Buffer) => {
		const output = data.toString().trim();
		if (output) {
			console.info(`[dev-server] ${output}`);
		}
	});

	devServerProcess.stderr?.on('data', (data: Buffer) => {
		const output = data.toString().trim();
		if (output) {
			console.error(`[dev-server-error] ${output}`);
		}
	});

	devServerProcess.on('error', (error: Error) => {
		console.error('Failed to start dev server:', error);
		throw error;
	});

	// Handle process exit
	devServerProcess.on('exit', (code, signal) => {
		console.info(`[dev-server] Process exited with code ${code} and signal ${signal}`);
		devServerProcess = null;
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

	// Register cleanup handlers for unexpected exits
	const cleanupHandler = () => {
		if (devServerProcess && typeof devServerProcess.pid === 'number' && devServerProcess.pid > 0) {
			console.info('🛑 Emergency cleanup: Stopping dev server...');
			try {
				if (process.platform === 'win32') {
					// Synchronous kill on Windows
					const { execSync } = require('child_process');
					execSync(`taskkill /pid ${devServerProcess.pid} /T /F`, { stdio: 'ignore' });
				} else {
					// Kill process group on Unix
					process.kill(-devServerProcess.pid, 'SIGKILL');
				}
			} catch (error) {
				// Ignore errors during emergency cleanup
			}
		}
	};

	process.on('SIGINT', cleanupHandler);
	process.on('SIGTERM', cleanupHandler);
	process.on('exit', cleanupHandler);

	// Return a teardown function
	return async () => {
		const serverProcess = devServerProcess;
		if (serverProcess && typeof serverProcess.pid === 'number' && serverProcess.pid > 0) {
			console.info('🛑 Stopping dev server...');
			try {
				await killProcessTree(serverProcess.pid);
				// Wait a bit to ensure cleanup
				await new Promise<void>((resolve) => {
					setTimeout(resolve, 1000);
				});
				console.info('✅ Dev server stopped');
			} catch (error) {
				console.error('Error stopping dev server:', error);
			}
		}
	};
}

export default globalSetup;
