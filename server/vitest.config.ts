import { defineConfig } from 'vitest/config';

/**
 * `npm test` runs against a temporary MongoDB that lives in memory and is thrown
 * away afterwards, so your Atlas data is never touched. The first run downloads
 * a MongoDB binary (a few hundred MB), so give it a minute.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 300_000, // first run downloads MongoDB
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:1/not-used-by-tests',
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789-abcdefghijklmnop',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789-abcdefghijklmnop',
      RESEND_API_KEY: '',
    },
  },
});
