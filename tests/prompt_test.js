const assert = require('assert');
const { buildPrompt } = require('../core/prompt');

const prompt = buildPrompt({
  ariaSnapshot: '- button "Approve"',
  label: 'Approve Request',
  data: { request_id: 'R-17' },
  rejected: ['await page.getByRole("button", { name: "Reject" }).click();']
});

assert(prompt.includes('- button "Approve"'));
assert(prompt.includes('Approve Request'));
assert(prompt.includes('"request_id"'));
assert(prompt.includes('{key}'));
assert(prompt.includes('R-17') === true);
assert(prompt.includes('PREVIOUSLY REJECTED'));
assert(!/login|password|username/i.test(prompt));
console.log('PASS: generic mapping prompt');
