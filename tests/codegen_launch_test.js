// TDD contract for the visible Playwright Codegen recorder.
const assert = require('assert');
const { buildCodegenArgs, buildCodegenEnv } = require('../core/helpers');

const args = buildCodegenArgs({
    cli: '/app/node_modules/@playwright/test/cli.js',
    targetUrl: 'http://127.0.0.1:3999/login.html',
    outputPath: '/tmp/state/codegen_123.js',
    profileDir: '/tmp/state/autotest'
});
assert.deepStrictEqual(args, [
    '/app/node_modules/@playwright/test/cli.js',
    'codegen',
    'http://127.0.0.1:3999/login.html',
    '--output',
    '/tmp/state/codegen_123.js',
    '--user-data-dir',
    '/tmp/state/autotest'
], 'plain Record must launch visible Playwright Codegen with isolated profile and output path');

const env = buildCodegenEnv({
    baseEnv: { EXISTING: 'yes' },
    browserPath: '/drivers/chrome',
    browsersPath: '/drivers/ms-playwright',
    profileDir: '/tmp/state/autotest',
    nodePath: '/app/node_modules',
    packaged: true
});
assert.strictEqual(env.BROWSER_PATH, '/drivers/chrome');
assert.strictEqual(env.PLAYWRIGHT_BROWSERS_PATH, '/drivers/ms-playwright');
assert.strictEqual(env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, '1');
assert.strictEqual(env.NODE_PATH, '/app/node_modules');
assert.strictEqual(env.ELECTRON_RUN_AS_NODE, '1');
assert.strictEqual(env.AUTOTEST_CDP_PROFILE, 'isolated');

console.log('PASS: codegen_launch_test — visible Codegen args, isolated profile, packaged env');
