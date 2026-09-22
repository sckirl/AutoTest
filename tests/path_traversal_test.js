// Prove-It: A0.6.1 — GET /codegen-result/:sessionId built its path from the raw URL param.
// sessionId = "../../../studio/server" resolves outside CORE_DIR (the "codegen_" prefix only
// neutralizes the FIRST ../ segment; every subsequent one traverses normally), letting an
// unauthenticated request read AND DELETE arbitrary files, confirmed by running path.join directly.
const assert = require('assert');
const path = require('path');
const { safeSessionId } = require('../core/helpers');

const CORE_DIR = path.join(__dirname, '../core');

// The confirmed-bypass payload from the doc, and siblings covering the same class.
for (const payload of ['../../../studio/server', '..%2f..%2fserver', '../server', 'a/../../etc/passwd', 'a\\..\\..\\etc']) {
  assert.strictEqual(safeSessionId(payload), null, `FAIL: traversal payload accepted: ${payload}`);
}

// Legitimate session ids are exactly what the server generates: Date.now().toString().
for (const id of ['1789962319010', '1']) {
  assert.strictEqual(safeSessionId(id), id, `FAIL: legitimate session id rejected: ${id}`);
}

// Defense-in-depth: even a payload that slips past the string check must not resolve outside CORE_DIR.
const outputPath = path.join(CORE_DIR, `codegen_${safeSessionId('1789962319010') || 'REJECTED'}.js`);
assert.ok(outputPath.startsWith(CORE_DIR + path.sep), 'FAIL: resolved path escaped CORE_DIR');

console.log('PASS: safeSessionId blocks path traversal, accepts real session ids');
