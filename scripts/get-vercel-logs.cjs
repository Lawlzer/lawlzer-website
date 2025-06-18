#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get deployment URL from command line
const deploymentUrl = process.argv[2];
if (!deploymentUrl) {
	console.error('Usage: node get-vercel-logs.cjs <deployment-url>');
	process.exit(1);
}

// Extract deployment ID from URL
const deploymentId = deploymentUrl.match(/https:\/\/([\w-]+)\.vercel\.app/)?.[1];
if (!deploymentId) {
	console.error('Invalid deployment URL. Expected format: https://deployment-id.vercel.app');
	process.exit(1);
}

// Function to find Vercel token
function findVercelToken() {
	// Try multiple possible locations
	const possiblePaths = [path.join(os.homedir(), '.vercel', 'auth.json'), path.join(os.homedir(), '.config', 'vercel', 'auth.json'), path.join(process.env.APPDATA || '', 'com.vercel.cli', 'auth.json'), path.join(process.env.LOCALAPPDATA || '', 'com.vercel.cli', 'auth.json')];

	for (const authPath of possiblePaths) {
		try {
			if (fs.existsSync(authPath)) {
				const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
				if (authData.token) {
					console.log(`Found token at: ${authPath}`);
					return authData.token;
				}
			}
		} catch (error) {
			// Continue to next path
		}
	}

	// Try to get token from CLI command
	try {
		const result = execSync('vercel whoami --token', { encoding: 'utf8', stdio: 'pipe' });
		const token = result.trim();
		if (token && !token.includes('Error')) {
			console.log('Got token from vercel CLI');
			return token;
		}
	} catch (error) {
		// Continue
	}

	return null;
}

// Get Vercel token
let token = process.env.VERCEL_TOKEN;
if (token) {
	console.log('Using VERCEL_TOKEN from environment');
} else {
	token = findVercelToken();
	if (!token) {
		console.error('Failed to find Vercel token. Make sure you are logged in with: vercel login');
		console.error('\nAlternatively, you can set VERCEL_TOKEN environment variable:');
		console.error('  Windows: set VERCEL_TOKEN=your-token-here');
		console.error('  Then run: node scripts/get-vercel-logs.cjs <deployment-url>');
		process.exit(1);
	}
}

// Function to make API request
function makeRequest(path) {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'api.vercel.com',
			path,
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		const req = https.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => (data += chunk));
			res.on('end', () => {
				try {
					resolve(JSON.parse(data));
				} catch (e) {
					resolve(data);
				}
			});
		});

		req.on('error', reject);
		req.end();
	});
}

async function fetchLogs() {
	try {
		console.log(`Fetching logs for deployment: ${deploymentId}\n`);

		// First, get deployment info
		const deployment = await makeRequest(`/v13/deployments/${deploymentId}`);

		if (deployment.error) {
			console.error('Error fetching deployment:', deployment.error.message);
			return;
		}

		console.log('Deployment Status:', deployment.readyState || deployment.state);
		console.log('Created:', new Date(deployment.created).toLocaleString());
		console.log('URL:', deployment.url);
		console.log('---\n');

		// Fetch build logs
		console.log('BUILD LOGS:');
		console.log('===========\n');

		const events = await makeRequest(`/v3/deployments/${deploymentId}/events?builds=1&limit=1000`);

		if (events.error) {
			console.error('Error fetching events:', events.error.message);
			return;
		}

		// Process and display events
		if (Array.isArray(events)) {
			events.forEach((event) => {
				if (event.type === 'stdout' || event.type === 'stderr') {
					console.log(event.payload.text);
				} else if (event.type === 'command') {
					console.log(`\n> ${event.payload.value}\n`);
				} else if (event.type === 'error') {
					console.error('\nERROR:', event.payload.value || event.payload.message || JSON.stringify(event.payload));
				}
			});
		} else {
			console.log('No build logs available');
		}

		// Try to fetch runtime logs if deployment is ready
		if (deployment.readyState === 'READY' || deployment.state === 'READY') {
			console.log('\n\nRUNTIME LOGS:');
			console.log('=============\n');

			const logs = await makeRequest(`/v2/deployments/${deploymentId}/logs?limit=100`);

			if (logs.logs && Array.isArray(logs.logs)) {
				logs.logs.forEach((log) => {
					const time = new Date(log.timestamp).toLocaleString();
					console.log(`[${time}] ${log.level}: ${log.message}`);
				});
			} else {
				console.log('No runtime logs available');
			}
		}
	} catch (error) {
		console.error('Failed to fetch logs:', error.message);
	}
}

fetchLogs();
