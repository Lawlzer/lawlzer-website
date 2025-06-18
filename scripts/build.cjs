#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting build process...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Current working directory:', process.cwd());
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

// Ensure DATABASE_URL is set for Prisma generation
if (!process.env.DATABASE_URL) {
	console.log('DATABASE_URL not found, using dummy MongoDB URL for Prisma generation');
	process.env.DATABASE_URL = 'mongodb+srv://dummy:dummy@dummy.mongodb.net/dummy?retryWrites=true&w=majority';
}

try {
	// Check if Next.js exists
	console.log('Checking for Next.js installation...');
	try {
		execSync('npx next --version', { stdio: 'inherit' });
	} catch (e) {
		console.error('Next.js not found!');
		throw e;
	}

	// Generate Prisma client
	console.log('Generating Prisma client...');
	execSync('npx prisma generate', {
		stdio: 'inherit',
		env: process.env,
	});
	console.log('Prisma client generated successfully');

	// Build Next.js
	console.log('Building Next.js application...');
	execSync('npx next build', {
		stdio: 'inherit',
		env: process.env,
	});
	console.log('Build completed successfully');
} catch (error) {
	console.error('Build failed:', error.message);
	console.error('Error details:', error);
	process.exit(1);
}
