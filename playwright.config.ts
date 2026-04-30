import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './core',
  fullyParallel: false, 
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, 
  reporter: 'html',
  use: {
    headless: true, // Switched to true for validation, user will set to false
    screenshot: 'off', // Engine handles this
    trace: 'off', // Engine handles this
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
