// RED→GREEN: hitting a dead server today throws a bare AggregateError [ECONNREFUSED]
// with an empty top-level .message (confirmed on Node 26) — a raw, unreadable stack
// trace instead of "Server not running. Use: npm test".
const assert = require('assert');
const { waitForServer } = require('../tests/run_all');

async function main() {
  let threw = null;
  try {
    // nothing listens on this port; short timeout keeps the test fast
    await waitForServer(45001, { timeoutMs: 300, intervalMs: 50 });
  } catch (e) {
    threw = e;
  }
  assert.ok(threw, 'FAIL: waitForServer should reject when nothing is listening');
  assert.strictEqual(threw.message, 'Server not running. Use: npm test',
    `FAIL: got unreadable error instead: ${threw.message}`);
  console.log('PASS: dead server produces a readable message, not a raw ECONNREFUSED stack');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
