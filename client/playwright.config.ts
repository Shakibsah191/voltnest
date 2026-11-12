import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test for the LIVE site. Run it after every deploy:
 *   $env:BASE_URL="https://your-site.vercel.app"; npm run test:smoke      (PowerShell)
 * First time only, download the browser:  npx playwright install chromium
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000, // the free Render server can take ~50 s to wake up
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
