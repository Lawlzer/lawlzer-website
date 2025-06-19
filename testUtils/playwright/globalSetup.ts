// import type { FullConfig } from '@playwright/test'; // No longer needed for project dependency approach
import type { FullConfig } from '@playwright/test';
import { expect } from '@playwright/test'; // Import test as setup
import { type ChildProcess, spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

let devServerProcess: ChildProcess | null = null;
let actualPort = 3000;

async function checkServerRunning(url: string, maxAttempts = 1): Promise<boolean> {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(url);
			if (response.ok || response.status === 404) return true; // 404 is fine, server is running
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
			} catch {
				// Process might already be dead
			}
		}
	} catch (error) {
		console.error('Error killing process tree:', error);
	}
}

async function startDevServer(): Promise<string> {
	return new Promise((resolve, reject) => {
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

		let serverStarted = false;

		// Capture server output for debugging
		devServerProcess.stdout?.on('data', (data: Buffer) => {
			const output = data.toString().trim();
			if (output) {
				console.info(`[dev-server] ${output}`);

				// Check for port in use message
				if (output.includes('Port') && output.includes('is in use')) {
					const portMatch = /using available port (\d+)/.exec(output);
					const portString = portMatch?.[1];
					if (typeof portString === 'string' && portString.length > 0) {
						actualPort = parseInt(portString, 10);
						console.info(`📍 Server will use port ${actualPort} instead`);
					}
				}

				// Check if server is ready
				if (output.includes('Ready in') || output.includes('✓ Ready')) {
					serverStarted = true;
					const url = `http://localhost:${actualPort}`;
					console.info(`✅ Dev server started at ${url}`);
					resolve(url);
				}
			}
		});

		devServerProcess.stderr?.on('data', (data: Buffer) => {
			const output = data.toString().trim();
			if (output && !output.includes('Found lockfile missing swc dependencies')) {
				console.error(`[dev-server-error] ${output}`);
			}
		});

		devServerProcess.on('error', (error: Error) => {
			console.error('Failed to start dev server:', error);
			reject(error);
		});

		// Handle process exit
		devServerProcess.on('exit', (code, signal) => {
			console.info(`[dev-server] Process exited with code ${code} and signal ${signal}`);
			devServerProcess = null;
			if (!serverStarted) {
				reject(new Error(`Dev server exited before starting (code: ${code})`));
			}
		});

		// Timeout after 90 seconds
		setTimeout(() => {
			if (!serverStarted) {
				reject(new Error('Dev server failed to start within 90 seconds'));
			}
		}, 90000);
	});
}

async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
	const envPath = path.resolve(process.cwd(), '.test.env');
	dotenv.config({ path: envPath });
	expect(process.env.NEXT_PUBLIC_FRONTEND_PORT).toBeDefined();
	expect(process.env.NEXT_PUBLIC_SCHEME).toBeDefined();

	// Check if server is running on default port
	const defaultURL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:3000';
	let isServerRunning = await checkServerRunning(defaultURL);
	let baseURL = defaultURL;

	if (!isServerRunning) {
		console.info(`📡 No server detected at ${defaultURL}, starting one automatically...`);

		try {
			// Start the dev server and get the actual URL
			baseURL = await startDevServer();

			// Wait for server to be ready
			console.info('⏳ Waiting for server to be ready...');
			isServerRunning = await checkServerRunning(baseURL, 30);

			if (!isServerRunning) {
				throw new Error(`Failed to connect to dev server at ${baseURL} after 30 seconds`);
			}
		} catch (error) {
			console.error('Failed to start dev server:', error);
			throw error;
		}
	} else {
		console.info(`✅ Using existing server at ${baseURL}`);
	}

	console.info(`✅ Server is ready at ${baseURL}`);

	// Set the actual base URL for Playwright tests
	process.env.PLAYWRIGHT_TEST_BASE_URL = baseURL;

	// Register cleanup handlers for unexpected exits
	const cleanupHandler = () => {
		if (devServerProcess && typeof devServerProcess.pid === 'number' && devServerProcess.pid > 0) {
			console.info('🛑 Emergency cleanup: Stopping dev server...');
			try {
				if (process.platform === 'win32') {
					// Synchronous kill on Windows using spawn
					spawn('taskkill', ['/pid', String(devServerProcess.pid), '/T', '/F'], {
						stdio: 'ignore',
						shell: true,
					});
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
