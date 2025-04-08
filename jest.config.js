import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
	// Add more setup options before each test is run
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jest-environment-jsdom',
	// Automatically clear mock calls, instances, contexts and results before every test
	clearMocks: true,
	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: true,
	// The directory where Jest should output its coverage files
	coverageDirectory: 'coverage',
	// An array of glob patterns indicating a set of files for which coverage information should be collected
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts', // Exclude type definition files
		'!src/**/index.{js,jsx,ts,tsx}', // Often just re-exports
		'!src/app/api/**', // Exclude API routes for now
		'!src/env.js', // Exclude environment setup
		'!src/trpc/**', // Exclude tRPC setup for now
		'!src/server/**', // Exclude server-specific logic for now
	],
	// Tell Jest how to resolve path aliases
	moduleNameMapper: {
		// Handle module aliases (this will be automatically configured for you soon)
		'^~/(.*)$': '<rootDir>/src/$1',
	},
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
