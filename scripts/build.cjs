#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting build process...');

// Ensure DATABASE_URL is set for Prisma generation
if (!process.env.DATABASE_URL) {
	console.log('DATABASE_URL not found, using dummy MongoDB URL for Prisma generation');
	process.env.DATABASE_URL = 'mongodb+srv://dummy:dummy@dummy.mongodb.net/dummy?retryWrites=true&w=majority';
}

try {
	// Generate Prisma client
	console.log('Generating Prisma client...');
	execSync('npx prisma generate', {
		stdio: 'inherit',
		env: process.env,
	});
	console.log('Prisma client generated successfully');

	// Build Next.js
	console.log('Building Next.js application...');
	execSync('next build', {
		stdio: 'inherit',
		env: process.env,
	});
	console.log('Build completed successfully');
} catch (error) {
	console.error('Build failed:', error.message);
	process.exit(1);
}
