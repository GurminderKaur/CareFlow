import { defineConfig, defaultExclude } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    pool: 'threads',
    exclude: [...defaultExclude, 'tests/e2e/**'],
  },
});
