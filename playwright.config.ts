import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './core',
  testMatch: '**/*.spec.ts', // Exclude .test.ts files which are for jest
  timeout: 60000,
  fullyParallel: false, 
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, 
  reporter: 'list',
  use: {
    headless: false,
    screenshot: 'off', // Engine handles this
    trace: 'on', // Enable tracing for the UI and Trace Viewer
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
