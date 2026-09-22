// Prove-It: A0.5.4 — interpolate('{nope}', null, {}) returned "" silently. A typo'd Excel
// header ("Usernme" vs "Username") compiled clean, ran clean, and filled the field blank,
// with nothing telling the tester their green run proved nothing.
const assert = require('assert');
const { interpolate } = require('../core/helpers');

assert.throws(() => interpolate('{nope}', null, {}), /nope/, 'FAIL: missing key must throw, not return ""');
assert.throws(() => interpolate('{nope}', {}, undefined), /nope/, 'FAIL: missing key must throw when fallback is absent too');

// Existing legitimate behavior must be untouched: a key present (even as "") in either source
// still resolves normally — only a key absent from BOTH is a hard error.
assert.strictEqual(interpolate('{username}', null, { username: 'alice' }), 'alice');
assert.strictEqual(interpolate('{password}', { password: 'S3cr3t' }, {}), 'S3cr3t');
assert.strictEqual(interpolate('{note}', { note: '' }, { note: 'fallback' }), '', 'FAIL: intentional blank iterData value must NOT fall through to fallbackObj');
assert.strictEqual(interpolate('{note}', {}, { note: 'fallback' }), 'fallback', 'FAIL: absent iterData value should fall through to fallbackObj');
assert.strictEqual(interpolate('no placeholders here', null, {}), 'no placeholders here');
assert.strictEqual(interpolate('', null, {}), '');

console.log('PASS: interpolate throws on a genuinely absent Data key, not on an intentional blank');
