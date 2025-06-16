#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('Installing native dependencies for platform:', os.platform(), os.arch());

// Only install Linux binaries on Linux systems
if (os.platform() === 'linux' && os.arch() === 'x64') {
	console.log('Installing Linux x64 native dependencies...');

	try {
		// Install native dependencies with legacy-peer-deps flag
		execSync('npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --legacy-peer-deps --no-save', {
			stdio: 'inherit',
		});
		console.log('Native dependencies installed successfully');
	} catch (error) {
		console.error('Failed to install native dependencies:', error.message);
		// Don't fail the build if native deps can't be installed
		// They might already be available or not needed
	}
} else {
	console.log('Skipping Linux native dependencies on non-Linux platform');
}
