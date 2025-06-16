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

// Install native dependencies for Linux
if (os.platform() === 'linux' && os.arch() === 'x64') {
	console.log('Installing Linux x64 native dependencies...');

	try {
		// Install native dependencies with legacy-peer-deps flag
		execSync('npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --legacy-peer-deps --no-save', {
			stdio: 'inherit',
		});
		console.log('Native dependencies installed successfully');
	} catch (error) {
		console.warn('Warning: Failed to install native dependencies:', error.message);
		// Don't fail the build if native deps can't be installed
	}
} else {
	console.log('Skipping Linux native dependencies on non-Linux platform');
}

console.log('Postinstall script completed');
