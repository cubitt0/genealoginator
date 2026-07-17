import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts: the engine tests are pure TypeScript (no JSX),
// so they need no React plugin, and this file is not type-checked by the app tsconfig.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
