// ponytail: self-check for the mobile compile branch (core/compiler.js).
// Guards against the exact regression this test was written for: compiler.js
// emitting Mocha syntax (describe/it/before) that /run's Playwright Test CLI
// cannot execute. Runs compiler.js in isolation, offline, no live server.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CORE = path.join(ROOT, 'core');
const blueprintPath = path.join(CORE, 'blueprint.json');
const mappingsPath = path.join(CORE, 'mappings.json');
const mobileOut = path.join(CORE, 'executed.mobile.js');
const webOut = path.join(CORE, 'executed.spec.ts');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

const backup = {};
for (const p of [blueprintPath, mappingsPath]) {
  backup[p] = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

const scenarioId = 'MOBILE_SELFCHECK';
fs.writeFileSync(blueprintPath, JSON.stringify([
  { Scenario_ID: scenarioId, Role: 'Self-check', Flow: [{ Mapping_Key: 'Tap Button', Data: {} }] }
], null, 2));
fs.writeFileSync(mappingsPath, JSON.stringify({
  'Tap Button': { steps: [{ type: 'click', target: "getByRole('button', { name: 'Go' })" }] }
}, null, 2));

function compile(platform) {
  execFileSync(process.execPath, [path.join(CORE, 'compiler.js')], {
    cwd: ROOT,
    env: { ...process.env, AUTOTEST_PLATFORM: platform }
  });
}

try {
  compile('mobile');
  check('Mobile output file written', fs.existsSync(mobileOut));
  const mobileCode = fs.readFileSync(mobileOut, 'utf8');
  check('No Mocha "describe(" leaked into mobile output', !mobileCode.includes('describe('));
  check('No Mocha "before(" leaked into mobile output', !mobileCode.includes('before('));
  check('No Mocha " it(" leaked into mobile output', !/\bit\(/.test(mobileCode));
  check('Mobile output is a self-running IIFE', mobileCode.includes('(async () => {') && mobileCode.trim().endsWith('})();'));
  check('Mobile output uses webdriverio remote()', mobileCode.includes("require('webdriverio')"));
  execFileSync(process.execPath, ['--check', mobileOut]); // throws if invalid syntax
  check('Mobile output is syntactically valid JS', true);

  compile('web');
  check('Web output file written', fs.existsSync(webOut));
  const webCode = fs.readFileSync(webOut, 'utf8');
  check('Web output still uses Playwright Test (test.describe)', webCode.includes('test.describe('));
  check('Web output has no mobile driver() call', !webCode.includes('driver.$('));
} finally {
  for (const p of [blueprintPath, mappingsPath]) {
    if (backup[p] === null) { try { fs.unlinkSync(p); } catch (e) {} }
    else fs.writeFileSync(p, backup[p]);
  }
  try { fs.unlinkSync(mobileOut); } catch (e) {}
}

console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
if (fail > 0) process.exit(1);
