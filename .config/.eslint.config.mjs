// @ts-check
import path from 'node:path';

import { createConfig } from '@lawlzer/config/eslint';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const baseConfig = createConfig(path.resolve(import.meta.dirname, '../tsconfig.eslint.json'));

export default [
	...baseConfig,

	// Repo-specific ignores not covered by @lawlzer/config
	{
		ignores: ['routeTypes', 'data', 'debug', 'next-env.d.ts'],
	},

	// React + React Hooks (framework-specific)
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react/jsx-uses-react': ['off'],
			'react/react-in-jsx-scope': ['off'],
			'react/prop-types': ['off'],
			'react/display-name': ['error'],
			'react/jsx-key': ['error'],
			'react/jsx-no-duplicate-props': ['error'],
			'react/jsx-no-undef': ['error'],
			'react/no-children-prop': ['error'],
			'react/no-danger-with-children': ['error'],
			'react/no-deprecated': ['error'],
			'react/no-direct-mutation-state': ['error'],
			'react/no-find-dom-node': ['error'],
			'react/no-is-mounted': ['error'],
			'react/no-render-return-value': ['error'],
			'react/no-string-refs': ['error'],
			'react/no-unescaped-entities': ['error'],
			'react/no-unknown-property': ['error'],
			'react/require-render-return': ['error'],
			'react-hooks/rules-of-hooks': ['error'],
			'react-hooks/exhaustive-deps': ['error'],
		},
	},

	// Test file overrides for React
	{
		files: ['**/*.test.ts', '**/*.test.tsx'],
		rules: {
			'react/jsx-no-bind': ['off'],
		},
	},

	// IMPORTANT: prettier config must be last to disable all conflicting rules
	prettierConfig,
];
