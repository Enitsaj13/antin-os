import { defineConfig, devices } from '@playwright/test';

const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? '0');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    video: process.env.PLAYWRIGHT_VIDEO === '1' ? 'on' : 'off',
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
  webServer: {
    command:
      'pnpm --filter web exec vite --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
