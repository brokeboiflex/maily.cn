import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// `shadcn add` copies Maily source into the consumer's app, where the host's own
// `eslint .` lints it. Package source therefore uses exactly the rules of the
// stock shadcn Vite template (`shadcn init -t vite`), including the React
// Compiler checks in react-hooks' recommended preset. scripts/test-shadcn-consumers.mjs
// lints the installed copies with a freshly generated template config.
const consumerTemplate = [
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
];

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/node_modules/**',
    'registry/**',
    'playground/**',
    '.sisyphus/**',
  ]),
  {
    files: ['packages/**/*.{ts,tsx}'],
    extends: consumerTemplate,
    languageOptions: { globals: globals.browser },
    rules: {
      // Off in the template too: stock shadcn primitives export variants.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
]);
