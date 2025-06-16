#!/usr/bin/env node

const { execSync } = require('child_process');

// Skip husky installation in production environments
if (process.env.VERCEL === '1' || process.env.CI === 'true') {
	console.log('Skipping husky installation in CI/Vercel environment');
	process.exit(0);
}

// Try to run husky
try {
	console.log('Setting up git hooks with husky...');
	execSync('npx husky', { stdio: 'inherit' });
	console.log('Husky setup completed');
} catch (error) {
	console.warn('Warning: Failed to setup husky:', error.message);
	console.warn('Git hooks will not be available');
	// Don't fail the install process
	process.exit(0);
}
