import dotenv from 'dotenv';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: '.test.env' });

const __dirname = path.resolve();
const setupFilesPath = path.resolve(__dirname, 'testUtils', 'unit', 'vitest.setup.ts');

export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'~': path.resolve(__dirname, 'src'),
			'@': path.resolve(__dirname, 'src'),
			testUtils: path.resolve(__dirname, 'testUtils'),
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: [setupFilesPath],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*', 'e2e/**', 'tests/**'],
	},
});
