import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
    { ignores: ['build/', 'coverage/'] },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: { ...globals.browser },
        },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // The automatic JSX runtime needs no React import, but many files still carry one.
            // Debug output leaks resume and match data into the browser console; errors and warnings may stay.
            'no-console': ['error', { allow: ['error', 'warn'] }],
            'no-unused-vars': [
                'error',
                { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^React$' },
            ],
        },
    },
    {
        files: ['**/*.test.{js,jsx}', 'src/setupTests.js', 'src/testUtils/**', 'src/**/__mocks__/**'],
        languageOptions: { globals: { ...globals.node, ...globals.vitest } },
    },
    {
        files: ['**/*.test.{js,jsx}'],
        ...testingLibrary.configs['flat/react'],
        rules: {
            ...testingLibrary.configs['flat/react'].rules,
            // user-event 13 fires events synchronously, so there is no promise to await.
            'testing-library/await-async-events': 'off',
        },
    },
    {
        files: ['vite.config.js', 'eslint.config.js'],
        languageOptions: { globals: { ...globals.node } },
    },
];
