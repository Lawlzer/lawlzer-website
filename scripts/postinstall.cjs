#!/usr/bin/env node

const { execSync } = require('child_process');

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

console.log('Postinstall script completed');
