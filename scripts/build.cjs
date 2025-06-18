#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting build process...');

// For Vercel builds, Prisma needs a DATABASE_URL even if just for generating the client
// This is safe because we're only generating the client, not connecting to the database
if (!process.env.DATABASE_URL) {
	console.log('DATABASE_URL not found - using placeholder for Prisma client generation');
	process.env.DATABASE_URL = 'mongodb://localhost:27017/placeholder';
}

try {
	// Generate Prisma client
	console.log('Generating Prisma client...');
	execSync('npx prisma generate', {
		stdio: 'inherit',
		env: process.env,
	});

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
