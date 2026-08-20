import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'test/stubs/react-native.ts'),
    },
  },
});