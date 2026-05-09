import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './core',
    timeout: 60000,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: 'list',
    use: {
        headless: process.env.PW_HEADLESS !== '0',
        screenshot: 'off', // Engine handles screenshots itself
        trace: 'off',      // Disabled - Engine handles screenshots
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Note: to run the E2E Studio audit explicitly, use:
    //   npx playwright test core/studio_audit.spec.ts
});
