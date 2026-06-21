import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './core',
  timeout: 60000,
  fullyParallel: process.env.AUTOTEST_FULLY_PARALLEL === '1',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: Number(process.env.AUTOTEST_WORKERS || 2),
  // Reporter is overridden by --reporter=json CLI arg during /run execution
  reporter: 'list',
  use: {
    headless: process.env.PW_HEADLESS === '1',
    screenshot: 'off',
    trace: 'off',
    // Support for bundled/portable chromium
    executablePath: process.env.BROWSER_PATH || undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
