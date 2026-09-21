// Prove-It test for the shared-mapping-literal bug: a step recorded via codegen for one
// scenario (literal value baked in) must still honor a DIFFERENT scenario's Data when that
// scenario reuses the same Mapping_Key. See core/helpers.js tokenizeLiterals.
const assert = require('assert');
const { tokenizeLiterals, interpolate } = require('../core/helpers');

// Simulates what /save-mapping receives from real Playwright codegen: a literal value, no {key}.
const stepsAsSavedByCodegen = [
  { type: 'click', target: "getByRole('textbox', { name: 'Password' })" },
  { type: 'fill', target: "getByRole('textbox', { name: 'Password' })", value: 'admin123' }
];

// HRM.A.1's blueprint Data (the scenario this was actually recorded under).
const recordedForData = { password: 'admin123' };

tokenizeLiterals(stepsAsSavedByCodegen, recordedForData);

assert.strictEqual(stepsAsSavedByCodegen[1].value, '{password}',
  'FAIL: literal "admin123" should have been tokenized to {password}');

// Now replay the SAME mapped step under HRM.A.2's Data (different password, same Mapping_Key).
const finalValue = interpolate(stepsAsSavedByCodegen[1].value, null, { password: 'wrongpassword' });
assert.strictEqual(finalValue, 'wrongpassword',
  'FAIL: a different scenario reusing this step should get its own password, not the recorded one');

console.log('PASS: tokenizeLiterals lets a shared mapped step honor per-scenario Data');
