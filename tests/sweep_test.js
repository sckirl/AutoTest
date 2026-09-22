// RED→GREEN: core/action_db.js's boot-time sweep only caught replay_* (server.js:892),
// so a cancelled codegen recording leaked forever. One predicate must cover both prefixes.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sweepOrphans } = require('../core/helpers');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep_test_'));
const orphans = ['replay_123.spec.ts', 'codegen_456.js', 'codegen_789.spec.js'];
const keep = ['mappings.json', 'notes.txt', 'codegen_helper.py']; // wrong extension = not our artifact

for (const f of [...orphans, ...keep]) fs.writeFileSync(path.join(dir, f), '');

const swept = sweepOrphans(dir);

assert.deepStrictEqual(swept.sort(), orphans.sort(), 'FAIL: sweep did not report exactly the orphaned files');
for (const f of orphans) {
  assert.ok(!fs.existsSync(path.join(dir, f)), `FAIL: orphan ${f} was not deleted`);
}
for (const f of keep) {
  assert.ok(fs.existsSync(path.join(dir, f)), `FAIL: non-orphan ${f} was wrongly deleted`);
}
assert.deepStrictEqual(sweepOrphans(path.join(dir, 'does-not-exist')), [], 'FAIL: missing dir should return [] not throw');

fs.rmSync(dir, { recursive: true, force: true });
console.log('PASS: sweepOrphans deletes replay_ and codegen_ orphans only');
