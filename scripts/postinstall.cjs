#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('Running postinstall script...');

// Check if we're in Vercel build environment
const isVercel = process.env.VERCEL === '1';

// Try to run prisma generate
try {
	console.log('Generating Prisma client...');

	// In Vercel, we might not have a valid DATABASE_URL during build
	if (isVercel && !process.env.DATABASE_URL) {
		console.log('Skipping Prisma generation in Vercel (no DATABASE_URL during build)');
		// Create a dummy DATABASE_URL just for generation
		process.env.DATABASE_URL = 'mongodb://localhost:27017/dummy';
	}

	execSync('npx --yes prisma generate', {
		stdio: 'inherit',
		env: { ...process.env },
	});
	console.log('Prisma client generated successfully');
} catch (error) {
	console.warn('Warning: Failed to generate Prisma client:', error.message);
	if (isVercel) {
		console.warn('This is expected in Vercel build environment');
	} else {
		console.warn('This might be expected in some build environments');
	}
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
