// Prove-It: A0.5.2 — tracing.start({snapshots:true, sources:true}) records the LITERAL value
// passed to fill()/selectOption() in the trace's action log, unconditionally. Confirmed by
// running it: even `tracing.start({screenshots:false, snapshots:false, sources:false})` still
// leaks the literal into trace.trace (Playwright's base call log always records call args), and
// tracing.stopChunk({mode:'discard'}) does NOT retroactively purge it either — both verified
// empirically, so per-value masking (the doc's original proposal) isn't achievable via Playwright's
// public tracing API. The only reliable fix: skip tracing entirely for a scenario whose Data
// contains a password/secret/token/pin-like key. Screenshots (a separate, non-traced call) still
// run, and password-type inputs render as dots in a screenshot, so evidence isn't fully lost.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-trace-redaction-'));
const previousEnv = Object.fromEntries(['AUTOTEST_STATE_DIR', 'AUTOTEST_DATA_DIR', 'AUTOTEST_RESULTS_DIR'].map(key => [key, process.env[key]]));
process.env.AUTOTEST_STATE_DIR = path.join(tempRoot, 'state');
process.env.AUTOTEST_DATA_DIR = path.join(tempRoot, 'data');
process.env.AUTOTEST_RESULTS_DIR = path.join(tempRoot, 'results');
const CORE = path.join(ROOT, 'core');
const STATE = process.env.AUTOTEST_STATE_DIR;
fs.mkdirSync(STATE, { recursive: true });
fs.mkdirSync(process.env.AUTOTEST_DATA_DIR, { recursive: true });
fs.mkdirSync(process.env.AUTOTEST_RESULTS_DIR, { recursive: true });
const blueprintPath = path.join(STATE, 'blueprint.json');
const mappingsPath = path.join(STATE, 'mappings.json');
const webOut = path.join(STATE, 'executed.spec.ts');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

function compile(scenarioData) {
  fs.writeFileSync(blueprintPath, JSON.stringify([
    { Scenario_ID: 'TRACE_SELFCHECK', Role: 'Self-check', Flow: [{ Mapping_Key: 'Fill Field', Data: scenarioData }] }
  ], null, 2));
  fs.writeFileSync(mappingsPath, JSON.stringify({
    'Fill Field': { steps: [{ type: 'fill', target: "getByRole('textbox')", value: 'literal, no placeholder' }] }
  }, null, 2));
  execFileSync(process.execPath, [path.join(CORE, 'compiler.js')], { cwd: ROOT, env: { ...process.env, AUTOTEST_STATE_DIR: STATE, AUTOTEST_PLATFORM: 'web' } });
  return fs.readFileSync(webOut, 'utf8');
}

try {
  const withPassword = compile({ password: 'S3cr3tPass!' });
  check('Scenario with a "password" Data key skips tracing.start', !withPassword.includes('tracing.start'));
  check('Scenario with a "password" Data key skips tracing.stop', !withPassword.includes('tracing.stop'));
  check('Screenshots still taken for a sensitive scenario', withPassword.includes('page.screenshot'));
  check('Withheld-trace note is written for the tester', withPassword.includes('TRACE_WITHHELD.txt'));

  const withToken = compile({ api_token: 'abc123' });
  check('Scenario with a "token" Data key also skips tracing', !withToken.includes('tracing.start'));

  const withoutSecret = compile({ username: 'alice' });
  check('Scenario with only non-sensitive Data keeps tracing.start', withoutSecret.includes('tracing.start'));
  check('Scenario with only non-sensitive Data keeps tracing.stop', withoutSecret.includes('tracing.stop'));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}

console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
if (fail > 0) process.exit(1);
