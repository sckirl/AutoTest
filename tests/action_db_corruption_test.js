// Prove-It: A0.6.3 — a truncated/corrupted action_database.json was overwritten with an
// empty {actions:[],groups:[]} on the very next read, destroying the only copy of whatever
// was recoverable by hand.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'core');
const DB_PATH = path.join(DB_DIR, 'action_database.json');
const backup = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH, 'utf8') : null;
const findBackups = () => fs.readdirSync(DB_DIR).filter(f => f.startsWith('action_database.json.corrupt-'));
const preExistingBackups = new Set(findBackups());

try {
  const corrupt = '{ "version": 1, "actions": [ { "id": "truncated_mid';
  fs.writeFileSync(DB_PATH, corrupt);

  delete require.cache[require.resolve('../core/action_db')];
  const ActionDB = require('../core/action_db');
  const result = ActionDB.read();

  assert.deepStrictEqual(result, { version: 1, actions: [], groups: [] }, 'FAIL: read() should still return a safe empty default');

  const newBackups = findBackups().filter(f => !preExistingBackups.has(f));
  assert.ok(newBackups.length > 0, 'FAIL: no .corrupt-* backup was written before the file was wiped');
  const savedCorrupt = fs.readFileSync(path.join(DB_DIR, newBackups[0]), 'utf8');
  assert.strictEqual(savedCorrupt, corrupt, 'FAIL: backup does not contain the original corrupt bytes');

  console.log('PASS: a corrupted action DB is backed up before being reset, not silently destroyed');
} finally {
  for (const f of findBackups()) {
    if (!preExistingBackups.has(f)) {
      try { fs.unlinkSync(path.join(DB_DIR, f)); } catch (e) {}
    }
  }
  if (backup === null) { try { fs.unlinkSync(DB_PATH); } catch (e) {} }
  else fs.writeFileSync(DB_PATH, backup);
}
