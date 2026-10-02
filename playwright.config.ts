import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

function resolveBundledBrowser(): string | undefined {
  if (process.env.BROWSER_PATH && fs.existsSync(process.env.BROWSER_PATH)) {
    return process.env.BROWSER_PATH;
  }
  // packaged: browsers ship unpacked under resourcesPath, never inside app.asar — a
  // __dirname-relative lookup can never hit there (mirrors core/helpers.js). Kept the dev
  // fallback (not deleted per audit): direct CLI runs with no BROWSER_PATH set depend on it.
  const msBase = process.env.RESOURCES_PATH
    ? path.join(process.env.RESOURCES_PATH, 'DRIVERS/ms-playwright')
    : path.resolve(__dirname, 'DRIVERS/ms-playwright');
  // A2/packaged: OS-first like server.js — a fixed mac-first order on a win box with a
  // stray mac .app folder returns an unexecutable path. process.platform/arch first.
  const ordered = process.platform === 'win32'
    ? ['chromium-1223/chrome-win/chrome.exe']
    : process.platform === 'darwin'
      ? [process.arch === 'arm64'
        ? 'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
        : 'chromium-1223/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing']
      : ['chromium-1223/chrome-linux/chrome'];
  // shrink: one candidate loop, not four copy-pasted existsSync blocks.
  for (const rel of [...ordered,
    'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chromium-1223/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chromium-1223/chrome-win/chrome.exe',
    'chromium-1223/chrome-linux/chrome',
  ]) {
    const p = path.join(msBase, rel);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

const bundledExecutable = resolveBundledBrowser();

export default defineConfig({
  // A1.1/doubt-review-found: compiler.js writes executed.spec.ts under AUTOTEST_STATE_DIR
  // when set (Electron's userData, outside the app's own read-only install dir) — testDir
  // must track the same env var or Playwright looks for it in the wrong place and reports
  // "No tests found." Unset (dev/test): unchanged, resolves relative to this file (./core).
  testDir: process.env.AUTOTEST_STATE_DIR || './core',
  // A-3 (found by blackbox relocatability pass): testDir tracked the env var but outputDir did
  // not, so Playwright still resolved its scratch dir to <app dir>/test-results and rmdir'd it
  // at startup — EACCES on a read-only install, before a single step ran. Every other write site
  // was relocated; this was the one left, and it is the one that fails first.
  outputDir: process.env.AUTOTEST_RESULTS_DIR
    ? path.join(process.env.AUTOTEST_RESULTS_DIR, 'test-results')
    : path.resolve(__dirname, 'test-results'),
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
