import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/node_modules/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {},
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
]
