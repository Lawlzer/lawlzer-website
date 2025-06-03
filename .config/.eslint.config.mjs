// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const commit = process.env.LINT_STAGED_COMMIT === 'true';

export default tseslint.config(
	{
		ignores: ['node_modules', 'logs', 'routeTypes', 'caches', 'cache', 'temp', 'tmp', 'debug', 'out', 'output', 'dist', 'lib', 'build', 'data', '.next', 'volume', 'volumes', '.vscode/**', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.eslint.json'],
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'unused-imports': unusedImports,
			'simple-import-sort': simpleImportSort,
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: './tsconfig.eslint.json',
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		settings: {
			react: {
				version: 'detect', // Automatically detect the React version
			},
		},
		rules: {
			// Misc
			'@typescript-eslint/no-unused-vars': commit
				? [
						'error',
						{
							argsIgnorePattern: '^_|^error$|^errors$',
							varsIgnorePattern: '^_|^error$|^errors$',
							caughtErrorsIgnorePattern: '^_|^error$|^errors$',
							destructuredArrayIgnorePattern: '^_',
							ignoreRestSiblings: true,
						},
					]
				: ['off'],

			// Import sorting - automatically sorts imports
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						// Node.js builtins prefixed with `node:`
						['^node:'],
						// Packages starting with @, then other packages
						['^@?\\w'],
						// Internal packages (your own @company packages)
						['^@company'],
						// Side effect imports
						['^\\u0000'],
						// Parent imports. Put `..` last
						['^\\.\\.(?!/?$)', '^\\.\\./?$'],
						// Other relative imports. Put same-folder imports and `.` last
						['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
						// Style imports
						['^.+\\.s?css$'],
					],
				},
			],
			'simple-import-sort/exports': 'error',

			// Unused imports configuration - automatically removes unused imports when commit=true
			'unused-imports/no-unused-imports': commit ? ['error'] : ['off'], // Auto-fix removes unused imports
			'unused-imports/no-unused-vars': ['off'], // We'll let the TypeScript rule handle unused variables

			'@typescript-eslint/adjacent-overload-signatures': ['error'],
			'@typescript-eslint/array-type': ['error'],
			'@typescript-eslint/await-thenable': ['off'],
			'@typescript-eslint/ban-ts-comment': ['off'], // if we have a comment, it's for a reason
			'@typescript-eslint/ban-tslint-comment': ['error'],
			'@typescript-eslint/class-literal-property-style': ['error'],
			'@typescript-eslint/consistent-generic-constructors': ['error'],
			'@typescript-eslint/consistent-indexed-object-style': commit ? ['error'] : ['off'],

			'@typescript-eslint/consistent-type-assertions': [
				// "<foo>" vs "as foo"
				'error',
				{
					assertionStyle: 'as',
				},
			],

			'@typescript-eslint/consistent-type-definitions': ['error'],
			'@typescript-eslint/consistent-type-exports': ['error', { fixMixedExportsWithInlineTypeSpecifier: true }],
			'@typescript-eslint/consistent-type-imports': ['error'],
			'@typescript-eslint/default-param-last': ['error'],
			'@typescript-eslint/dot-notation': ['error'],
			'@typescript-eslint/explicit-member-accessibility': ['error'],
			'@typescript-eslint/init-declarations': ['off'],
			'@typescript-eslint/member-ordering': ['error'],
			'@typescript-eslint/method-signature-style': ['error'],
			'@typescript-eslint/naming-convention': ['off'],
			'@typescript-eslint/no-array-constructor': ['error'],
			'@typescript-eslint/no-array-delete': ['error'],
			'@typescript-eslint/no-base-to-string': ['error'],
			'@typescript-eslint/no-confusing-non-null-assertion': ['error'],
			'@typescript-eslint/no-confusing-void-expression': ['error'],
			'@typescript-eslint/no-dupe-class-members': ['error'],
			'@typescript-eslint/no-duplicate-imports': ['off'],
			'@typescript-eslint/no-duplicate-type-constituents': ['error'],
			'@typescript-eslint/no-dynamic-delete': ['error'],
			'@typescript-eslint/no-empty': ['off'],
			'@typescript-eslint/no-empty-function': ['off'], // useful for templating
			'@typescript-eslint/no-empty-interface': ['off'], // useful for templating
			'@typescript-eslint/no-empty-object-type': ['off'], // empty interfaces are useful for templating
			'@typescript-eslint/no-explicit-any': ['off'], // if we have an any, it's for a reason
			'@typescript-eslint/no-extra-non-null-assertion': ['error'],
			'@typescript-eslint/no-extraneous-class': ['off'], // Classes with only static methods are useful for organization
			'@typescript-eslint/no-floating-promises': [
				'error',
				{
					ignoreVoid: true,
					ignoreIIFE: true,
				},
			],

			'@typescript-eslint/no-for-in-array': ['error'],
			'@typescript-eslint/no-implicit-any-catch': ['off'],
			'@typescript-eslint/no-implied-eval': ['error'],
			'@typescript-eslint/no-import-type-side-effects': ['error'],
			'@typescript-eslint/no-inferrable-types': ['error'],
			'@typescript-eslint/no-invalid-this': ['error'],
			'@typescript-eslint/no-invalid-void-type': ['error'],
			'@typescript-eslint/no-loop-func': ['error'],
			'@typescript-eslint/no-loss-of-precision': ['error'],
			'@typescript-eslint/no-magic-numbers': ['off'],
			'@typescript-eslint/no-meaningless-void-operator': ['error'],
			'@typescript-eslint/no-misused-new': ['error'],
			'@typescript-eslint/no-misused-promises': ['error'],
			'@typescript-eslint/no-mixed-enums': ['error'],
			'@typescript-eslint/no-namespace': commit ? ['error'] : ['off'],
			'@typescript-eslint/no-non-null-asserted-nullish-coalescing': ['error'],
			'@typescript-eslint/no-non-null-asserted-optional-chain': ['error'],
			'@typescript-eslint/no-non-null-assertion': ['off'],
			'@typescript-eslint/no-parameter-properties': ['off'],
			'@typescript-eslint/no-redeclare': ['error'],
			'@typescript-eslint/no-redundant-type-constituents': ['error'],
			'@typescript-eslint/no-require-imports': ['error'],
			'@typescript-eslint/no-shadow': ['error'],
			'@typescript-eslint/no-this-alias': ['error'],
			'@typescript-eslint/no-type-alias': ['off'],
			'@typescript-eslint/no-unnecessary-boolean-literal-compare': ['error'],
			'@typescript-eslint/no-unnecessary-condition': ['off'],
			'@typescript-eslint/no-unnecessary-qualifier': ['error'],
			'@typescript-eslint/no-unnecessary-type-arguments': ['error'],
			'@typescript-eslint/no-unnecessary-type-assertion': ['error'],
			'@typescript-eslint/no-unsafe-argument': ['off'],
			'@typescript-eslint/no-unsafe-assignment': ['off'], // it's any, go away
			'@typescript-eslint/no-unsafe-call': ['off'], // it's any, let us do whatever we want
			'@typescript-eslint/no-unsafe-enum-comparison': ['error'],
			'@typescript-eslint/no-unsafe-function-type': ['error'],
			'@typescript-eslint/no-unsafe-member-access': ['off'], // no (any).foo -- because it's any. it's any, let us do what we want.
			'@typescript-eslint/no-unsafe-return': ['error'],
			'@typescript-eslint/no-unsafe-unary-minus': ['error'],
			'@typescript-eslint/no-unused-expressions': ['error'],
			'@typescript-eslint/no-use-before-define': ['error'],
			'@typescript-eslint/no-useless-constructor': ['off'],
			'@typescript-eslint/no-useless-empty-export': ['error'],
			'@typescript-eslint/no-var-requires': commit ? ['error'] : ['off'],
			'@typescript-eslint/no-wrapper-object-types': ['error'],
			'@typescript-eslint/non-nullable-type-assertion-style': ['error'],
			'@typescript-eslint/only-throw-error': ['off'],
			'@typescript-eslint/parameter-properties': ['error'],
			'@typescript-eslint/prefer-as-const': ['error'],
			'@typescript-eslint/prefer-const': ['off'],
			'@typescript-eslint/prefer-enum-initializers': ['error'],
			'@typescript-eslint/prefer-find': ['error'],
			'@typescript-eslint/prefer-for-of': ['error'],
			'@typescript-eslint/prefer-function-type': ['error'],
			'@typescript-eslint/prefer-includes': ['error'],
			'@typescript-eslint/prefer-literal-enum-member': ['error'],
			'@typescript-eslint/prefer-namespace-keyword': ['error'],
			'@typescript-eslint/prefer-nullish-coalescing': ['off'], // Technically should be on, but it's unnecessary and just annoying for AI...
			'@typescript-eslint/prefer-optional-chain': ['error'],
			'@typescript-eslint/prefer-promise-reject-errors': ['error'],
			'@typescript-eslint/prefer-readonly': ['error'],
			'@typescript-eslint/prefer-readonly-parameter-types': ['off'],
			'@typescript-eslint/prefer-reduce-type-parameter': ['error'],
			'@typescript-eslint/prefer-regexp-exec': ['error'],
			'@typescript-eslint/prefer-return-this-type': ['error'],
			'@typescript-eslint/prefer-string-starts-ends-with': ['error'],
			'@typescript-eslint/prefer-ts-expect-error': ['error'],
			'@typescript-eslint/promise-function-async': ['error'],
			'@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: true }],
			'@typescript-eslint/require-await': ['off'], // If a function is not REQUIRED to be async, it must not be async. just annoying.
			'@typescript-eslint/restrict-plus-operands': ['error'],
			'@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true, allowNumber: true, allowBoolean: true, allowNullish: true }], // Seems to be same as above, but for template literals
			'@typescript-eslint/return-await': ['error'],
			'@typescript-eslint/sort-type-constituents': ['error'],
			'@typescript-eslint/sort-type-union-intersection-members': ['off'], // Renamed to "sort-type-constituents"

			'@typescript-eslint/strict-boolean-expressions': [
				'error',
				{
					allowString: true, // Disables `if (myString is truthy)`
					allowNumber: false, // Disables `if (myNumber is truthy)`
					allowNullableObject: true, // Enables `if (myObject)` for nullable objects
					allowNullableBoolean: true, // Enables `if (myNullableBool)` for nullable booleans
					allowNullableString: false, // Disables `if (myNullableString)`
					allowNullableNumber: false, // Disables `if (myNullableNumber)`
					allowNullableEnum: false, // Disables `if (myNullableEnum)`
					allowAny: true, // Enables `if (my: any)`
					allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
				},
			],
			'@typescript-eslint/switch-exhaustiveness-check': ['error'],
			'@typescript-eslint/triple-slash-reference': ['error'],
			'@typescript-eslint/typedef': ['error'],
			'@typescript-eslint/unified-signatures': ['error'],
			'constructor-super': ['off'],
			'getter-return': ['off'],
			'no-array-constructor': ['off'],
			'no-class-assign': ['off'],
			'no-console': ['error', { allow: ['info', 'warn', 'error', 'debug', 'trace', commit ? 'N/A this is ignored' : 'log'] }],
			'no-const-assign': ['off'],
			'no-dupe-args': ['off'],
			'no-dupe-class-members': ['off'],
			'no-dupe-keys': ['off'],
			'no-empty-function': ['off'],
			'no-func-assign': ['off'],
			'no-implied-eval': ['off'],
			'no-import-assign': ['off'],
			'no-new-native-nonconstructor': ['off'],
			'no-new-symbol': ['off'],
			'no-obj-calls': ['off'],
			'no-redeclare': ['off'],
			'no-setter-return': ['off'],
			'no-this-before-super': ['off'],
			'no-throw-literal': ['off'],
			'no-undef': ['off'],
			'no-unreachable': ['off'],
			'no-unsafe-negation': ['off'],
			'no-unused-expressions': ['off'],
			'no-unused-vars': ['off'],
			'no-var': commit ? ['error'] : ['off'],
			'no-with': ['off'],
			'prefer-const': ['error'],
			'prefer-promise-reject-errors': ['off'],
			'prefer-rest-params': ['error'],
			'prefer-spread': ['error'],
			'require-await': ['off'],

			// Enhanced general rules for better code quality
			'arrow-body-style': ['error', 'as-needed'],
			curly: ['error', 'multi-line', 'consistent'],
			eqeqeq: ['error', 'always', { null: 'ignore' }],
			'no-constant-binary-expression': 'error',
			'no-constructor-return': 'error',
			'no-lonely-if': 'error',
			'no-promise-executor-return': 'error',
			'no-self-compare': 'error',
			'no-template-curly-in-string': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-unreachable-loop': 'error',
			'no-unused-private-class-members': 'error',
			'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
			'no-unneeded-ternary': ['error', { defaultAssignment: false }],
			'operator-assignment': ['error', 'always'],
			'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
			'prefer-destructuring': [
				'error',
				{
					VariableDeclarator: { array: false, object: true },
					AssignmentExpression: { array: false, object: false },
				},
			],
			'prefer-template': 'error',
			'require-atomic-updates': 'error',
			yoda: ['error', 'never'],

			// React Rules
			'react/boolean-prop-naming': ['off'], // Let developers choose their own naming conventions
			'react/button-has-type': ['error'],
			'react/default-props-match-prop-types': ['error'],
			'react/destructuring-assignment': ['off'], // Let developers choose based on context
			'react/display-name': ['error'],
			'react/forbid-component-props': ['off'], // Too restrictive
			'react/forbid-dom-props': ['off'], // Can be configured for specific props if needed
			'react/forbid-elements': ['off'], // Can be configured for specific elements if needed
			'react/forbid-foreign-prop-types': ['error'],
			'react/forbid-prop-types': ['error', { forbid: ['any', 'array', 'object'] }],
			'react/function-component-definition': ['off'], // Let developers choose their component style
			'react/hook-use-state': ['error'],
			'react/iframe-missing-sandbox': ['error'],
			'react/jsx-boolean-value': ['error', 'never'],
			'react/jsx-child-element-spacing': ['off'], // Prettier handles this
			'react/jsx-closing-bracket-location': ['off'], // Prettier handles this
			'react/jsx-closing-tag-location': ['off'], // Prettier handles this
			'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never', propElementValues: 'always' }],
			'react/jsx-curly-newline': ['off'], // Prettier handles this
			'react/jsx-curly-spacing': ['off'], // Prettier handles this
			'react/jsx-equals-spacing': ['off'], // Prettier handles this
			'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
			'react/jsx-first-prop-new-line': ['off'], // Prettier handles this
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-handler-names': ['error'],
			'react/jsx-indent': ['off'], // Prettier handles this
			'react/jsx-indent-props': ['off'], // Prettier handles this
			'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-max-depth': ['off'], // Trust developers to write readable code
			'react/jsx-max-props-per-line': ['off'], // Prettier handles this
			'react/jsx-newline': ['off'], // Too opinionated
			'react/jsx-no-bind': ['off'], // Modern React handles this efficiently
			'react/jsx-no-comment-textnodes': ['error'],
			'react/jsx-no-constructed-context-values': ['error'],
			'react/jsx-no-duplicate-props': ['error'],
			'react/jsx-no-leaked-render': ['error'],
			'react/jsx-no-literals': ['off'], // Too restrictive
			'react/jsx-no-script-url': ['error'],
			'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
			'react/jsx-no-undef': ['error'],
			'react/jsx-no-useless-fragment': ['error'],
			'react/jsx-one-expression-per-line': ['off'], // Let Prettier handle this
			'react/jsx-pascal-case': ['error'],
			'react/jsx-props-no-multi-spaces': ['off'], // Prettier handles this
			'react/jsx-props-no-spreading': ['off'], // Spreading is useful
			'react/jsx-sort-default-props': ['off'], // Can conflict with other rules
			'react/jsx-sort-props': ['off'], // Can cause circular fixes with Prettier
			'react/jsx-tag-spacing': ['off'], // Prettier handles this
			'react/jsx-uses-react': ['off'], // Not needed with React 17+ JSX transform
			'react/jsx-uses-vars': ['error'],
			'react/jsx-wrap-multilines': ['off'], // Prettier handles this
			'react/no-access-state-in-setstate': ['error'],
			'react/no-adjacent-inline-elements': ['off'], // Formatter handles this
			'react/no-array-index-key': ['error'],
			'react/no-arrow-function-lifecycle': ['error'],
			'react/no-children-prop': ['error'],
			'react/no-danger': ['error'],
			'react/no-danger-with-children': ['error'],
			'react/no-deprecated': ['error'],
			'react/no-did-mount-set-state': ['error'],
			'react/no-did-update-set-state': ['error'],
			'react/no-direct-mutation-state': ['error'],
			'react/no-find-dom-node': ['error'],
			'react/no-invalid-html-attribute': ['error'],
			'react/no-is-mounted': ['error'],
			'react/no-multi-comp': ['off'], // Allow multiple components in one file when it makes sense
			'react/no-namespace': ['error'],
			'react/no-object-type-as-default-prop': ['error'],
			'react/no-redundant-should-component-update': ['error'],
			'react/no-render-return-value': ['error'],
			'react/no-set-state': ['off'], // setState is necessary
			'react/no-string-refs': ['error'],
			'react/no-this-in-sfc': ['error'],
			'react/no-typos': ['error'],
			'react/no-unescaped-entities': ['error'],
			'react/no-unknown-property': ['error'],
			'react/no-unsafe': ['error'],
			'react/no-unstable-nested-components': ['error'],
			'react/no-unused-class-component-methods': ['error'],
			'react/no-unused-prop-types': ['error'],
			'react/no-unused-state': ['error'],
			'react/no-will-update-set-state': ['error'],
			'react/prefer-es6-class': ['error', 'always'],
			'react/prefer-exact-props': ['off'], // TypeScript handles this
			'react/prefer-read-only-props': ['off'], // Use TypeScript readonly
			'react/prefer-stateless-function': ['error'],
			'react/prop-types': ['off'], // We use TypeScript
			'react/react-in-jsx-scope': ['off'], // Not needed with React 17+ JSX transform
			'react/require-default-props': ['off'], // TypeScript handles this
			'react/require-optimization': ['off'], // Not always necessary
			'react/require-render-return': ['error'],
			'react/self-closing-comp': ['error'],
			'react/sort-comp': ['off'], // Can conflict with formatting
			'react/sort-default-props': ['off'], // Deprecated
			'react/sort-prop-types': ['off'], // We use TypeScript
			'react/state-in-constructor': ['error', 'never'],
			'react/static-property-placement': ['error', 'static public field'],
			'react/style-prop-object': ['error'],
			'react/void-dom-elements-no-children': ['error'],

			// React Hooks Rules (All errors for strictness)
			'react-hooks/rules-of-hooks': ['error'],
			'react-hooks/exhaustive-deps': ['error'],

			// Experimental, may change
			'@typescript-eslint/no-duplicate-enum-values': ['error'], // experimental
			'@typescript-eslint/no-unnecessary-type-constraint': ['error'], // experimental
			'@typescript-eslint/no-unsafe-declaration-merging': ['error'], // experimental
			'@typescript-eslint/unbound-method': ['error'], // experimental
		},
	},

	{
		files: ['**/*.test.ts', '**/*.test.tsx'],
		rules: {
			'@typescript-eslint/no-unsafe-call': ['off'],
			'@typescript-eslint/no-confusing-void-expression': ['off'],
			'react/jsx-no-bind': ['off'], // More flexibility in tests
		},
	},

	{
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},

	// IMPORTANT: prettier config must be last to disable all conflicting rules
	// This prevents ESLint and Prettier from fighting over formatting
	prettierConfig
);
