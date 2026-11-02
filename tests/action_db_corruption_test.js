// Prove-It: A0.6.3 — a truncated/corrupted action_database.json was overwritten with an
// empty {actions:[],groups:[]} on the very next read, destroying the only copy of whatever
// was recoverable by hand.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-action-db-'));
const previousEnv = Object.fromEntries(['AUTOTEST_STATE_DIR', 'AUTOTEST_DATA_DIR', 'AUTOTEST_RESULTS_DIR'].map(key => [key, process.env[key]]));
process.env.AUTOTEST_STATE_DIR = path.join(tempRoot, 'state');
process.env.AUTOTEST_DATA_DIR = path.join(tempRoot, 'data');
process.env.AUTOTEST_RESULTS_DIR = path.join(tempRoot, 'results');
const DB_DIR = process.env.AUTOTEST_STATE_DIR;
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'action_database.json');
const findBackups = () => fs.readdirSync(DB_DIR).filter(f => f.startsWith('action_database.json.corrupt-'));

try {
  const corrupt = '{ "version": 1, "actions": [ { "id": "truncated_mid';
  fs.writeFileSync(DB_PATH, corrupt);

  delete require.cache[require.resolve('../core/action_db')];
  const ActionDB = require('../core/action_db');
  const result = ActionDB.read();

  assert.deepStrictEqual(result, { version: 1, actions: [], groups: [] }, 'FAIL: read() should still return a safe empty default');

  const newBackups = findBackups();
  assert.ok(newBackups.length > 0, 'FAIL: no .corrupt-* backup was written before the file was wiped');
  const savedCorrupt = fs.readFileSync(path.join(DB_DIR, newBackups[0]), 'utf8');
  assert.strictEqual(savedCorrupt, corrupt, 'FAIL: backup does not contain the original corrupt bytes');

  console.log('PASS: a corrupted action DB is backed up before being reset, not silently destroyed');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
