// Exercise the real Codegen close callback and HTTP route with an injected child process.
const assert = require('assert');
const { EventEmitter } = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { startStudio } = require('./run_all');

const source = fs.readFileSync(path.join(__dirname, '../studio/server.js'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, '../studio/studio-ui.html'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, `could not locate ${start}`);
  return source.slice(a, b);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-result-'));
try {
  const sessions = new Map();
  const children = [];
  let activeCodegen = null;
  const context = {
    console, fs, path, acorn: require('acorn'), process: { execPath: '/fake/node' },
    CORE_DIR: temp, ROOT_DIR: temp, MS_PLAYWRIGHT_PATH: temp, BUNDLED_BROWSER: null,
    PLAYWRIGHT_CLI: '/fake/cli', trackedProcesses: new Set(), codegenSessions: sessions,
    CODEGEN_SESSION_LIMIT: 3, activeCodegen,
    buildCodegenArgs: () => [], buildCodegenEnv: () => ({}), isPackaged: () => false,
    spawn: () => { const child = new EventEmitter(); child.kill = () => { child.killed = true; }; children.push(child); return child; }
  };
  vm.createContext(context);
  vm.runInContext(section('function rememberCodegenSession(', 'function launchVisibleReplay('), context);
  const routeSource = section("app.get('/codegen-result/:sessionId'", "app.post('/save-mapping'");
  const routeBody = routeSource.slice(routeSource.indexOf('(req, res) => {') + '(req, res) => {'.length, routeSource.lastIndexOf('});'));
  context.safeSessionId = value => /^\d+$/.test(value) ? value : null;
  vm.runInContext(`globalThis.resultHandler = (req, res) => {${routeBody}}`, context);
  function getResult(id) {
    const result = { status: 200, body: null };
    const res = { status(code) { result.status = code; return this; }, json(body) { result.body = body; return this; } };
    context.resultHandler({ params: { sessionId: id } }, res);
    return result;
  }

  const sessionA = { id: '1001', status: 'running', code: null, outputPath: path.join(temp, 'codegen_1001.js'), previewCode: null, previewVersion: 0 };
  sessions.set(sessionA.id, sessionA);
  const outputA = sessionA.outputPath;
  const earlySource = "import { test, expect } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n  await page.goto('about:blank');\n});";
  const updatedSource = "import { test, expect } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n  await page.getByRole('button', { name: 'Continue' }).click();\n});";
  const nextValidSource = "import { test, expect } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n  await page.getByLabel('Email').fill('a@example.com');\n});";
  fs.writeFileSync(outputA, earlySource);
  context.session = sessionA;
  context.outputPath = outputA;
  vm.runInContext(section('function launchVisibleCodegen(', 'function launchVisibleReplay('), context);
  context.launchVisibleCodegen({ targetUrl: 'about:blank', outputPath: outputA, session: sessionA });
  const early = getResult('1001').body;
  assert.strictEqual(early.ready, false, 'early --output file must remain pending until child close');
  assert.strictEqual(early.status, 'running');
  assert.strictEqual(early.sessionId, '1001');
  assert.strictEqual(early.previewCode, earlySource, 'first complete CLI snapshot should be visible provisionally');
  assert.strictEqual(early.previewVersion, 1);
  fs.writeFileSync(outputA, updatedSource);
  const updated = getResult('1001').body;
  assert.strictEqual(updated.ready, false, 'live updates must never report final readiness');
  assert.strictEqual(updated.previewCode, updatedSource);
  assert.strictEqual(updated.previewVersion, 2, 'each changed valid snapshot gets a higher revision');
  fs.writeFileSync(outputA, "import { test, expect } from '@playwright/test';");
  const importOnly = getResult('1001').body;
  assert.strictEqual(importOnly.previewCode, updatedSource, 'valid import-only prefix must not replace a prior action preview');
  assert.strictEqual(importOnly.previewVersion, updated.previewVersion, 'unsupported envelope must not advance preview revision');
  fs.writeFileSync(outputA, nextValidSource);
  const nextValid = getResult('1001').body;
  assert.strictEqual(nextValid.previewCode, nextValidSource, 'preview must advance when a valid Playwright callback appears');
  assert.strictEqual(nextValid.previewVersion, updated.previewVersion + 1);
  fs.writeFileSync(outputA, 'const = incomplete;');
  assert.strictEqual(getResult('1001').body.previewCode, nextValid.previewCode, 'partial syntax must leave the last valid preview intact');
  assert.strictEqual(getResult('1001').body.previewVersion, nextValid.previewVersion);
  const sessionB = { id: '1002', status: 'running', code: null };
  sessions.set(sessionB.id, sessionB);
  const outputB = path.join(temp, 'codegen_1002.js');
  fs.writeFileSync(outputB, 'partial');
  context.launchVisibleCodegen({ targetUrl: 'about:blank', outputPath: outputB, session: sessionB });
  fs.writeFileSync(outputA, 'const final = "authoritative";');
  children[0].emit('close', 0, null);
  assert.strictEqual(context.activeCodegen, children[1], 'late A close must not clear the active B child');
  assert.strictEqual(getResult('1001').body.code, 'const final = "authoritative";', 'successful close must capture the final file contents');
  assert.strictEqual(getResult('1001').body.code, getResult('1001').body.code, 'completed reads must be repeatable');
  children[1].emit('close', 2, null);
  assert.strictEqual(getResult('1002').status, 409, 'nonzero exit must never become ready');
  assert.strictEqual(getResult('9999').body.ready, false, 'unknown numeric session must not read an output file or claim success');

  const sessionC = { id: '1003', status: 'running', code: null };
  sessions.set(sessionC.id, sessionC);
  const outputC = path.join(temp, 'codegen_1003.js');
  const mappingPath = path.join(temp, 'mappings.json');
  fs.writeFileSync(mappingPath, JSON.stringify({ Existing: { steps: [{ type: 'click', target: 'getByRole("button")' }] } }));
  const savedMapping = fs.readFileSync(mappingPath, 'utf8');
  fs.writeFileSync(outputC, 'cancelled');
  context.launchVisibleCodegen({ targetUrl: 'about:blank', outputPath: outputC, session: sessionC });
  sessionC.status = 'cancelled';
  children[2].emit('close', null, 'SIGKILL');
  assert.strictEqual(getResult('1003').status, 409, 'cancelled child close must not publish output');
  assert.strictEqual(fs.readFileSync(mappingPath, 'utf8'), savedMapping, 'cancelled or failed capture must leave prior mapping data intact');

  for (const id of ['2001', '2002', '2003', '2004']) {
    const old = sessions.values().next().value;
    if (old && old.status === 'running') old.status = 'complete';
    const entry = { id, status: 'complete', code: id };
    context.rememberCodegenSession(entry);
  }
  assert(sessions.size <= 3, 'session retention must stay bounded');
  assert.match(source, /manualCopy: true/);
  assert.match(ui, /Replay output is not transferred automatically/);
  console.log('PASS: codegen_result_test — early/late writes, repeated reads, failed/cancelled exits, unknown IDs and UI ownership');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

// Run the real poll functions with deferred network responses to cover A → B races and edits.
async function verifyUiPollOwnership() {
  const pollSource = ui.slice(ui.indexOf('        let codegenPollTimer = null;'), ui.indexOf('        function resetSaveToLibToggle('));
  const timers = new Map();
  let nextTimer = 0;
  let resolveA, resolveC;
  const resolveB = [];
  const codeArea = { value: '', matches: selector => selector === ':focus' };
  const retainedCode = { style: { display: 'none' } };
  const retainedCodeSource = { textContent: '' };
  const previewLabel = { style: { display: 'none' }, textContent: '' };
  const saveButton = { disabled: false };
  const context = {
    codeArea, retainedCode, retainedCodeSource, previewLabel, codegenPreviewLabel: previewLabel, retainedCodeSummary: { textContent: '' }, isUserInteracting: false, codeAreaRevision: 0, codeAreaRenderRevision: 0, recordModalOperation: 1,
    document: { getElementById: () => saveButton },
    fetch: url => new Promise(resolve => { if (url.endsWith('/A')) resolveA = resolve; else if (url.endsWith('/B')) resolveB.push(resolve); else resolveC = resolve; }),
    setInterval: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id),
    showStatus: () => {}, console
  };
  vm.createContext(context);
  vm.runInContext(pollSource, context);
  context.startCodegenPoll('A', 1, 0);
  const pollA = [...timers.values()][0];
  const requestA = pollA();
  context.recordModalOperation = 2;
  vm.runInContext('recordModalOperation = 2', context);
  context.startCodegenPoll('B', 2, 0);
  resolveA({ ok: true, json: async () => ({ ready: true, sessionId: 'A', code: 'async ({ page }) => { await page.goto("A"); }' }) });
  await requestA;
  assert.strictEqual(codeArea.value, '', 'late A response must not overwrite B modal');
  const pollB = [...timers.values()][0];
  const requestB = pollB();
  resolveB[0]({ ok: true, json: async () => ({ ready: false, sessionId: 'B', status: 'running', previewCode: 'const page = "first click";', previewVersion: 1 }) });
  await requestB;
  assert.match(codeArea.value, /first click/, 'focused textarea should receive provisional code without being treated as user-edited');
  assert.match(previewLabel.textContent, /Live preview.*provisional/i);
  const staleUpdate = pollB();
  const latestUpdate = pollB();
  resolveB[2]({ ok: true, json: async () => ({ ready: false, sessionId: 'B', status: 'running', previewCode: 'const page = "third click";', previewVersion: 3 }) });
  await latestUpdate;
  resolveB[1]({ ok: true, json: async () => ({ ready: false, sessionId: 'B', status: 'running', previewCode: 'const page = "second click";', previewVersion: 2 }) });
  await staleUpdate;
  assert.match(codeArea.value, /third click/, 'out-of-order older preview cannot replace the newest snapshot');
  const inputStart = ui.indexOf('        codeArea.oninput = () => {');
  const inputEnd = ui.indexOf('        };', inputStart) + '        };'.length;
  vm.runInContext(ui.slice(inputStart, inputEnd), context);
  vm.runInContext('codegenPending = true; codegenSaveBlocked = true', context);
  codeArea.value = 'user edit while recording';
  vm.runInContext('codeAreaRevision++; codeArea.oninput()', context);
  assert.strictEqual(codeArea.value, 'user edit while recording');
  assert.match(retainedCodeSource.textContent, /third click/, 'live preview remains retrievable after the user edits');
  const changedWhileEdited = pollB();
  resolveB[3]({ ok: true, json: async () => ({ ready: false, sessionId: 'B', status: 'running', previewCode: 'const page = "fourth click";', previewVersion: 4 }) });
  await changedWhileEdited;
  assert.strictEqual(codeArea.value, 'user edit while recording', 'live updates cannot overwrite actual edits');
  assert.match(retainedCodeSource.textContent, /fourth click/, 'read-only live preview continues to refresh after edits');

  context.recordModalOperation = 3;
  vm.runInContext('recordModalOperation = 3', context);
  context.startCodegenPoll('C', 3, context.codeAreaRevision);
  const pollC = [...timers.values()][0];
  const requestC = pollC();
  context.codeArea.value = 'user edit';
  context.codeAreaRevision++;
  context.isUserInteracting = true;
  resolveC({ ok: true, json: async () => ({ ready: true, sessionId: 'C', code: 'async ({ page }) => { await page.goto("C-final"); }' }) });
  await requestC;
  assert.strictEqual(codeArea.value, 'user edit', 'final capture must preserve the user-edited textarea');
  assert.strictEqual(retainedCode.style.display, 'block', 'final capture remains visible when edits are preserved');
  assert.match(retainedCodeSource.textContent, /page\.goto\("C-final"\)/, 'user can retrieve final captured code from the fallback');
}

async function verifyManualPreviewOwnership() {
  const pollSource = ui.slice(ui.indexOf('        let codegenPollTimer = null;'), ui.indexOf('        function resetSaveToLibToggle('));
  const manualSource = ui.slice(ui.indexOf('        function openManualModal('), ui.indexOf('        async function closeModal()'));
  let resolveOld, resolveNew;
  const codeArea = { value: '', placeholder: '' };
  const retainedCode = { style: { display: 'block' } };
  const retainedCodeSource = { textContent: 'old retained capture' };
  const context = {
    codeArea, retainedCode, retainedCodeSource, retainedCodeSummary: { textContent: '' }, previewLabel: { style: {}, textContent: '' }, codegenPreviewLabel: { style: {}, textContent: '' }, modal: { style: {} }, isUserInteracting: false, codeAreaRevision: 0, codeAreaRenderRevision: 0, recordModalOperation: 0,
    document: { getElementById: id => id === 'save-mapping-btn' ? { disabled: false } : ({ style: {}, innerHTML: '', innerText: '' }) },
    resetSaveToLibToggle: () => {},
    fetch: url => new Promise(resolve => { if (url.includes('Old')) resolveOld = resolve; else resolveNew = resolve; }),
    setInterval: () => 1, clearInterval: () => {}, console
  };
  vm.createContext(context);
  vm.runInContext(pollSource + manualSource, context);
  context.openManualModal('Old', 'S1');
  assert.strictEqual(retainedCode.style.display, 'none', 'new Manual modal clears a prior retained capture');
  assert.strictEqual(retainedCodeSource.textContent, '', 'new Manual modal clears prior retained source');
  context.openManualModal('New', 'S2');
  resolveOld({ json: async () => ({ code: 'old preview' }) });
  await Promise.resolve();
  await Promise.resolve();
  assert.strictEqual(codeArea.value, '', 'old Manual preview cannot populate the newer modal');
  codeArea.value = 'manual edit';
  context.codeAreaRevision++;
  resolveNew({ json: async () => ({ code: 'new preview' }) });
  await Promise.resolve();
  await Promise.resolve();
  assert.strictEqual(codeArea.value, 'manual edit', 'late Manual preview cannot overwrite text typed while loading');
}

async function verifyRecordPreviewAfterCapture() {
  const pollStart = ui.indexOf('        let codegenPollTimer = null;');
  const resetStart = ui.indexOf('        function resetSaveToLibToggle(', pollStart);
  const recordStart = ui.indexOf('        async function openRecordModal(', resetStart);
  const manualStart = ui.indexOf('        function openManualModal(', recordStart);
  const pollAndRecord = ui.slice(pollStart, resetStart) + ui.slice(resetStart, manualStart);
  const timers = new Map();
  let nextTimer = 0;
  let resolvePreview, resolveRecord, resolvePoll;
  const codeArea = { value: '', placeholder: '' };
  const elements = {
    'record-guide-banner': { innerHTML: '' },
    'modal-title': { innerText: '' },
    'base-url': { value: 'about:blank' },
    'platform-toggle': { value: 'web' },
    'save-to-lib-toggle': { checked: false },
    'save-to-lib-name': { value: '', style: {} },
    'save-mapping-btn': { disabled: false }
  };
  const context = {
    codeArea, retainedCode: { style: {} }, retainedCodeSource: { textContent: '' }, retainedCodeSummary: { textContent: '' }, previewLabel: { style: {}, textContent: '' }, codegenPreviewLabel: { style: {}, textContent: '' },
    modal: { style: {} }, isUserInteracting: false, codeAreaRevision: 0, codeAreaRenderRevision: 0,
    document: { getElementById: id => id === 'save-mapping-btn' ? (elements[id] ||= { disabled: false }) : elements[id] },
    fetch: url => new Promise(resolve => {
      if (url.startsWith('/preview/')) resolvePreview = resolve;
      else if (url === '/record') resolveRecord = resolve;
      else resolvePoll = resolve;
    }),
    setInterval: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id), showStatus: () => {}, console
  };
  vm.createContext(context);
  vm.runInContext(pollAndRecord, context);
  const opening = context.openRecordModal('Target', 'S1');
  assert.strictEqual(elements['save-mapping-btn'].disabled, true, 'save must stay disabled while codegen is running');
  resolveRecord({ ok: true, json: async () => ({ sessionId: 'record-session', isReplay: false }) });
  await opening;
  const poll = [...timers.values()][0];
  const pendingPoll = poll();
  resolvePoll({ ok: true, json: async () => ({ ready: true, sessionId: 'record-session', code: 'async ({ page }) => { await page.goto("final"); }' }) });
  await pendingPoll;
  assert.strictEqual(elements['save-mapping-btn'].disabled, false, 'save becomes available only after final close delivery');
  resolvePreview({ json: async () => ({ code: 'async ({ page }) => { await page.goto("previous"); }' }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(codeArea.value, /page\.goto\("final"\)/, 'late initial preview must not overwrite completed final capture');
}

async function verifyHttpRoute() {
  const studio = await startStudio();
  try {
    const base = `http://127.0.0.1:${studio.port}`;
    const unknown = await fetch(`${base}/codegen-result/999999999`);
    assert.strictEqual(unknown.status, 200);
    assert.strictEqual((await unknown.json()).ready, false, 'real HTTP route must keep unknown numeric sessions pending');
    const invalid = await fetch(`${base}/codegen-result/not-a-session`);
    assert.strictEqual(invalid.status, 400, 'real HTTP route must reject invalid identifiers');
  } finally {
    await studio.stop();
  }
}

async function verifyFailureStatesAndRecovery() {
  const pollStart = ui.indexOf('        let codegenPollTimer = null;');
  const resetStart = ui.indexOf('        function resetSaveToLibToggle(', pollStart);
  const recordStart = ui.indexOf('        async function openRecordModal(', resetStart);
  const manualStart = ui.indexOf('        function openManualModal(', recordStart);
  const closeStart = ui.indexOf('        async function closeModal()', manualStart);
  const saveStart = ui.indexOf('        async function saveMapping()', closeStart);
  const saveEnd = ui.indexOf('\n        }', saveStart) + '\n        }'.length;
  const inputStart = ui.indexOf('        codeArea.oninput = () => {');
  const inputEnd = ui.indexOf('        };', inputStart) + '        };'.length;
  const sourceUnderTest = ui.slice(pollStart, resetStart) + ui.slice(inputStart, inputEnd) + ui.slice(resetStart, closeStart) + ui.slice(saveStart, saveEnd);
  const timers = new Map();
  let nextTimer = 0;
  let recordResponse;
  let terminalResponse;
  let fetchCount = 0;
  const events = [];
  const codeArea = { value: 'provisional', placeholder: '' };
  const retained = { style: { display: 'block' } };
  const retainedSource = { textContent: 'old preview' };
  const previewLabel = { style: { display: 'block' }, textContent: '' };
  const button = { disabled: false };
  const elements = {
    'save-mapping-btn': button,
    'save-to-lib-toggle': { checked: false },
    'save-to-lib-name': { value: '', style: {} },
    'record-guide-banner': { textContent: '', appendChild() {} },
    'modal-title': { innerText: '' },
    'base-url': { value: 'about:blank' },
    'platform-toggle': { value: 'web' }
  };
  const context = {
    codeArea, retainedCode: retained, retainedCodeSource: retainedSource,
    retainedCodeSummary: { textContent: '' }, codegenPreviewLabel: previewLabel,
    modal: { style: {} }, codeAreaRevision: 0, codeAreaRenderRevision: 0,
    recordModalOperation: 0, isUserInteracting: false,
    document: {
      getElementById: id => elements[id] || { style: {}, innerHTML: '', innerText: '' },
      createElement: () => ({ style: {}, textContent: '' }),
      createTextNode: text => ({ textContent: text })
    },
    fetch: url => {
      if (url === '/record') return new Promise(resolve => { recordResponse = resolve; });
      if (url.endsWith('/timeout')) return Promise.resolve({ ok: true, json: async () => ({ ready: false, sessionId: 'timeout', status: 'running' }) });
      if (url.startsWith('/codegen-result/')) return new Promise(resolve => { terminalResponse = resolve; });
      if (url.startsWith('/preview/')) return Promise.resolve({ json: async () => ({ code: '' }) });
      fetchCount++;
      return Promise.resolve({ ok: true, json: async () => ({}) });
    },
    setInterval: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id),
    resetSaveToLibToggle: () => {}, showStatus: (message, type) => events.push({ message, type }),
    console
  };
  vm.createContext(context);
  vm.runInContext(sourceUnderTest, context);

  const launch = context.openRecordModal('Target', 'S1');
  recordResponse({ ok: false, json: async () => ({ error: 'simulated launch failure' }) });
  await launch;
  assert.strictEqual(button.disabled, true, 'launch failure must not enable mapping save without a final capture');
  assert.strictEqual(vm.runInContext('codegenSaveBlocked', context), true);
  assert.match(previewLabel.textContent, /did not start/i);
  await context.saveMapping();
  assert.strictEqual(fetchCount, 0, 'saveMapping guard must reject calls even if invoked while the button is disabled');

  const manualFetch = context.openManualModal('Target', 'S1');
  await Promise.resolve();
  assert.strictEqual(button.disabled, false, 'Manual Map must restore saving after a failed recorder launch');
  assert.strictEqual(vm.runInContext('codegenSaveBlocked', context), false);

  vm.runInContext('codegenSaveBlocked = true; codegenPending = true; codegenLive = true; latestCodegenPreviewBody = "await page.click()"', context);
  button.disabled = true;
  const operation = vm.runInContext('recordModalOperation', context);
  context.startCodegenPoll('terminal', operation, 0);
  const terminalPoll = [...timers.values()][0];
  const pending = terminalPoll();
  assert.strictEqual(typeof terminalResponse, 'function', 'terminal poll should request its session result');
  terminalResponse({ ok: false, json: async () => ({ sessionId: 'terminal', status: 'failed', error: 'recorder exited 1' }) });
  await pending;
  assert.strictEqual(button.disabled, true, 'terminal poll failure must leave Save blocked');
  assert.strictEqual(vm.runInContext('codegenPending', context), false, `failed session is no longer active: ${JSON.stringify(events)}`);
  assert.strictEqual(vm.runInContext('codegenLive', context), false);
  codeArea.value = 'typed after failure';
  vm.runInContext('codeArea.oninput()', context);
  assert.match(previewLabel.textContent, /last preview.*provisional/i);
  assert.doesNotMatch(previewLabel.textContent, /live preview/i, 'typing after failure must not revive the live claim');
  await context.saveMapping();
  assert.strictEqual(fetchCount, 0, 'saveMapping must reject a failed session even after editing its provisional text');

  vm.runInContext('codegenSaveBlocked = true; codegenPending = true; codegenLive = true', context);
  button.disabled = true;
  context.startCodegenPoll('timeout', operation, 0);
  const timeoutPoll = [...timers.values()][0];
  for (let i = 0; i < 202; i++) await timeoutPoll();
  assert.strictEqual(button.disabled, true, 'timeout must leave Save blocked');
  assert.strictEqual(vm.runInContext('codegenLive', context), false);
  assert.match(previewLabel.textContent, /timed out.*provisional/i);
  assert.match(events.at(-1).message, /Manual Map/);
  assert.doesNotMatch(events.at(-1).message, /paste.*above/i, 'timeout guidance must not suggest saving provisional text');
  void manualFetch;
}

verifyUiPollOwnership().then(verifyManualPreviewOwnership).then(verifyRecordPreviewAfterCapture).then(verifyFailureStatesAndRecovery).then(verifyHttpRoute).then(() => console.log('PASS: codegen_result_test — focus, edits, preview ordering, failure recovery and isolated HTTP route')).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
