const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: './',
});

// Initial custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
	// Add more setup options before each test is run
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	// Ensure jsdom is set here for component tests
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
		'!src/**/*.d.ts',
		'!src/**/index.{js,jsx,ts,tsx}',
		// '!src/app/api/**', // Consider including API routes if testing them
		'!src/env.js',
		'!src/trpc/**',
		'!src/server/**',
	],
	// Tell Jest how to resolve path aliases
	moduleNameMapper: {
		// Handle module aliases (this will be automatically configured for you soon)
		'^~/(.*)$': '<rootDir>/src/$1',
	},
	// Remove transformIgnorePatterns from here
	// transformIgnorePatterns: [
	//     '/node_modules/(?!(next-auth|@auth/core|oauth4webapi)/)',
	// ],
};

const modifyJestConfig = async () => {
	// Create the base config object from next/jest
	// Pass our custom config, including the transformIgnorePatterns attempt
	const jestConfig = await createJestConfig(customJestConfig)();

	// *** Forcefully override transformIgnorePatterns after creation ***
	jestConfig.transformIgnorePatterns = ['/node_modules/(?!(next-auth|@auth/core|oauth4webapi|@auth/prisma-adapter)/)', '^.+.module.(css|sass|scss)$'];

	jestConfig.transform = {
		'^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
	};

	// Verify the environment is correctly set for component tests
	console.log('Final Jest testEnvironment:', jestConfig.testEnvironment); // Add log for debugging

	// Return the final, modified config
	return jestConfig;
};

module.exports = modifyJestConfig();
