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

  // A0.7.6: an accessible name containing a literal `"` must be escaped, not spliced raw
  // into the XPath string (which would produce a broken/hijacked expression).
  fs.writeFileSync(blueprintPath, JSON.stringify([
    { Scenario_ID: 'MOBILE_QUOTE', Role: 'Self-check', Flow: [{ Mapping_Key: 'Delete Button', Data: {} }] }
  ], null, 2));
  fs.writeFileSync(mappingsPath, JSON.stringify({
    'Delete Button': { steps: [{ type: 'click', target: 'getByRole(\'button\', { name: \'Delete "All" Records\' })' }] }
  }, null, 2));
  compile('mobile');
  const quoteEscapedCode = fs.readFileSync(mobileOut, 'utf8');
  // A name with only one quote type is correctly wrapped in the OTHER quote character — no
  // concat() needed for that case, only when a name contains BOTH quote types (checked below).
  check('Full accessible name (including the embedded quotes) survives extraction', quoteEscapedCode.includes('Delete \\"All\\" Records'));
  check('Raw unescaped quote is not spliced into the XPath string', !quoteEscapedCode.includes('@text="Delete "All"'));
  execFileSync(process.execPath, ['--check', mobileOut]);
  check('Quote-escaped mobile output is syntactically valid JS', true);

  // A0.7.6: a name with BOTH quote types can't be wrapped in either alone — this must use
  // XPath's concat() escaping, the actual case xpathEscape's third branch exists for.
  fs.writeFileSync(blueprintPath, JSON.stringify([
    { Scenario_ID: 'MOBILE_MIXED_QUOTES', Role: 'Self-check', Flow: [{ Mapping_Key: 'Greet Button', Data: {} }] }
  ], null, 2));
  fs.writeFileSync(mappingsPath, JSON.stringify({
    'Greet Button': { steps: [{ type: 'click', target: `getByText('Say "Hi" to Bob's Diner')` }] }
  }, null, 2));
  compile('mobile');
  const mixedQuoteCode = fs.readFileSync(mobileOut, 'utf8');
  check('Mixed-quote accessible name uses concat() escaping', mixedQuoteCode.includes('concat('));
  execFileSync(process.execPath, ['--check', mobileOut]);
  check('Mixed-quote mobile output is syntactically valid JS', true);

  // A0.7.6: an unsupported locator type (e.g. getByPlaceholder) used to fall through and get
  // handed to driver.$() as invalid Playwright-syntax text. Must fail compile loudly instead.
  fs.writeFileSync(blueprintPath, JSON.stringify([
    { Scenario_ID: 'MOBILE_UNSUPPORTED', Role: 'Self-check', Flow: [{ Mapping_Key: 'Search Box', Data: {} }] }
  ], null, 2));
  fs.writeFileSync(mappingsPath, JSON.stringify({
    'Search Box': { steps: [{ type: 'fill', target: "getByPlaceholder('Search')", value: 'query' }] }
  }, null, 2));
  let threw = false;
  try { compile('mobile'); } catch (e) { threw = /Unsupported locator/.test(e.message) || /Unsupported locator/.test(String(e.stderr || '')); }
  check('Unsupported mobile locator type fails compile loudly, not silently', threw);

  // A0.7.2: a mobile step that throws must fail the process, not exit 0 and report
  // "completed" with no error. Stub webdriverio (no real Appium device in this environment)
  // so the generated script actually runs, with driver.$().click() throwing.
  fs.writeFileSync(blueprintPath, JSON.stringify([
    { Scenario_ID: 'MOBILE_FAILS', Role: 'Self-check', Flow: [{ Mapping_Key: 'Tap Button', Data: {} }] }
  ], null, 2));
  fs.writeFileSync(mappingsPath, JSON.stringify({
    'Tap Button': { steps: [{ type: 'click', target: "getByRole('button', { name: 'Go' })" }] }
  }, null, 2));
  compile('mobile');
  // ponytail: a real webdriverio is installed (root + DRIVERS node_modules), which the normal
  // ancestor node_modules walk finds before NODE_PATH is ever consulted — so redirecting via
  // NODE_PATH alone can't win. Force the redirect with a resolver hook instead of touching any
  // real dependency on disk.
  const os = require('os');
  const stubRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-stub-'));
  const stubPath = path.join(stubRoot, 'stub.js');
  fs.writeFileSync(stubPath, `
    exports.remote = async () => ({
      $: () => ({ click: () => { throw new Error('element not found'); }, setValue() {} }),
      url() {}, keys() {}, pause() {}, saveScreenshot() {}, deleteSession() {}
    });
  `);
  const harnessPath = path.join(stubRoot, 'harness.js');
  fs.writeFileSync(harnessPath, `
    const Module = require('module');
    const orig = Module._resolveFilename;
    Module._resolveFilename = function(request, ...args) {
      if (request === 'webdriverio') return ${JSON.stringify(stubPath)};
      return orig.call(this, request, ...args);
    };
    require(${JSON.stringify(mobileOut)});
  `);
  let mobileRunExitCode = null;
  try {
    execFileSync(process.execPath, [harnessPath], { cwd: ROOT });
    mobileRunExitCode = 0;
  } catch (e) {
    mobileRunExitCode = e.status;
  } finally {
    fs.rmSync(stubRoot, { recursive: true, force: true });
  }
  check('A failing mobile step exits non-zero, not silently "completed"', mobileRunExitCode !== 0);

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
