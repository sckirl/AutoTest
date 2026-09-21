import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

function resolveBundledBrowser(): string | undefined {
  if (process.env.BROWSER_PATH && fs.existsSync(process.env.BROWSER_PATH)) {
    return process.env.BROWSER_PATH;
  }
  const defaultMacArm = path.resolve(__dirname, 'DRIVERS/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  if (fs.existsSync(defaultMacArm)) return defaultMacArm;
  const defaultMacX64 = path.resolve(__dirname, 'DRIVERS/ms-playwright/chromium-1223/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  if (fs.existsSync(defaultMacX64)) return defaultMacX64;
  const defaultWin = path.resolve(__dirname, 'DRIVERS/ms-playwright/chromium-1223/chrome-win/chrome.exe');
  if (fs.existsSync(defaultWin)) return defaultWin;
  const defaultLinux = path.resolve(__dirname, 'DRIVERS/ms-playwright/chromium-1223/chrome-linux/chrome');
  if (fs.existsSync(defaultLinux)) return defaultLinux;
  return undefined;
}

const bundledExecutable = resolveBundledBrowser();

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
    executablePath: bundledExecutable,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        executablePath: bundledExecutable,
      },
    },
  ],
});
