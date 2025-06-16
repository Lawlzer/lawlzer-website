#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('Running postinstall script...');

// Try to run prisma generate
try {
	console.log('Generating Prisma client...');
	execSync('npx --yes prisma generate', { stdio: 'inherit' });
	console.log('Prisma client generated successfully');
} catch (error) {
	console.warn('Warning: Failed to generate Prisma client:', error.message);
	console.warn('This might be expected in some build environments');
}

// Install sharp for Linux environments (needed for Vercel)
if (process.env.VERCEL || (os.platform() === 'linux' && os.arch() === 'x64')) {
	console.log('Installing sharp for Linux x64...');
	try {
		// Install sharp with platform-specific binaries
		execSync('npm install --include=optional --os=linux --cpu=x64 sharp --legacy-peer-deps', {
			stdio: 'inherit',
		});
		console.log('Sharp installed successfully for Linux');
	} catch (error) {
		console.warn('Warning: Failed to install sharp for Linux:', error.message);
		// Don't fail the build if sharp installation fails
	}
}

console.log('Postinstall script completed');
