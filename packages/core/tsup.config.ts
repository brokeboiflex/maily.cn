import { defineConfig, type Options } from 'tsup';

const packageOptions: Options = {
  splitting: false,
  sourcemap: true,
  treeshake: false,
  dts: true,
  format: ['esm', 'cjs'],
  external: ['react', 'react-dom'],
  outExtension: ({ format }) => {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
};

export default defineConfig([
  {
    ...packageOptions,
    entry: {
      index: 'src/index.ts',
    },
    banner: {
      js: "'use client'",
    },
  },
  {
    ...packageOptions,
    entry: {
      index: 'src/blocks.ts',
    },
    outDir: 'dist/blocks',
  },
  {
    ...packageOptions,
    entry: {
      index: 'src/extensions.ts',
    },
    outDir: 'dist/extensions',
  },
  {
    ...packageOptions,
    entry: {
      index: 'src/mailbox/index.tsx',
    },
    banner: {
      js: "'use client'",
    },
    outDir: 'dist/mailbox',
  },
]);
