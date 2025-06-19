export default [
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
		},

		files: ['src/**/*.js'],
		ignores: ['**/*.config.js', '!**/eslint.config.js'],
		rules: {
			semi: 'error',
			'prefer-const': 'error',
			'no-unused-vars': ['error', { argsIgnorePattern: 'event|e|ex' }],
		},
	},
];
