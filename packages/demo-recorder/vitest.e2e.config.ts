import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.e2e.test.ts'],
    testTimeout: 180000, // 3 minutes per test
    hookTimeout: 60000,  // 1 minute for setup/teardown
  },
});
