import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nuxt currently brings in a newer Vite than the standalone Vue package tooling.
  // The plugin works at runtime; this cast only smooths over the cross-version type mismatch.
  plugins: [vue() as never],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
