#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting build process...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Current working directory:', process.cwd());
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('VERCEL environment:', process.env.VERCEL);
console.log('CI environment:', process.env.CI);

// Log all environment variables that start with NEXT_PUBLIC_ or AUTH_
console.log('\nEnvironment variables:');
Object.keys(process.env).forEach((key) => {
	if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('AUTH_') || key === 'DATABASE_URL' || key === 'VERCEL' || key === 'CI') {
		console.log(`  ${key}: ${key === 'DATABASE_URL' || key.includes('SECRET') ? '[REDACTED]' : process.env[key]}`);
	}
});

// Ensure DATABASE_URL is set for Prisma generation
if (!process.env.DATABASE_URL) {
	console.log('\nDATABASE_URL not found, using dummy MongoDB URL for Prisma generation');
	process.env.DATABASE_URL = 'mongodb+srv://dummy:dummy@dummy.mongodb.net/dummy?retryWrites=true&w=majority';
}

try {
	// Check if Next.js exists
	console.log('\nChecking for Next.js installation...');
	try {
		execSync('npx next --version', { stdio: 'inherit' });
	} catch (e) {
		console.error('Next.js not found!');
		throw e;
	}

	// Generate Prisma client
	console.log('\nGenerating Prisma client...');
	execSync('npx prisma generate', {
		stdio: 'inherit',
		env: process.env,
	});
	console.log('Prisma client generated successfully');

	// Build Next.js
	console.log('\nBuilding Next.js application...');
	execSync('npx next build', {
		stdio: 'inherit',
		env: process.env,
	});
	console.log('\nBuild completed successfully');
} catch (error) {
	console.error('\nBuild failed:', error.message);
	console.error('Error details:', error);
	process.exit(1);
}
