import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const __dirname = path.resolve();
const setupFilesPath = path.resolve(__dirname, 'testUtils', 'unit', 'vitest.setup.ts');

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'jsdom', // or 'jsdom' if testing React components
		globals: true, // Use Vitest's globals (describe, it, expect, etc.)
		setupFiles: [setupFilesPath],
		coverage: {
			provider: 'v8', // or 'istanbul'
			reporter: ['text', 'json', 'html'],
		},
		env: {}, // Assign the loaded environment variables
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/cypress/**',
			'**/.{idea,git,cache,output,temp}/**',
			'**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
			'e2e/**', // Exclude the Playwright e2e tests directory
		],
	},
});
