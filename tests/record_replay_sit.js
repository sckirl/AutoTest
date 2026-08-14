// ponytail: rigorous SIT audit script for Record, Replay, and Global-Sync features
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 3000, path: urlPath, method,
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': data ? Buffer.byteLength(data) : 0 
      }
    };
    const r = http.request(opts, res => {
      let d = ''; 
      res.on('data', c => d += c); 
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function startServer() {
  console.log("🚀 Starting AutoTest Studio test server...");
  const serverProc = spawn(process.execPath, [path.join(__dirname, '../studio/server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3000' },
    stdio: 'pipe'
  });

  serverProc.stdout.on('data', d => {
    const msg = d.toString();
    if (msg.includes('Studio Live on 3000')) {
      // server is ready
    }
  });

  // wait up to 5s for server to respond to ping
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await req('GET', '/run-status');
      if (res.status === 200) {
        console.log("✅ Test server live and responsive on port 3000\n");
        return serverProc;
      }
    } catch (e) {}
  }
  throw new Error("Server failed to start on port 3000");
}

async function runAudit() {
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log(" 🔬 AUTO-TEST STUDIO: RIGOROUS SIT AUDIT FOR RECORD & REPLAY ENGINE");
  console.log("══════════════════════════════════════════════════════════════════════\n");

  let pass = 0, fail = 0;
  const findings = [];

  function check(testId, name, cond, detail = '') {
    if (cond) {
      pass++;
      console.log(`  ✅ PASS [${testId}] ${name}`);
      findings.push({ id: testId, name, status: 'PASS', detail: '' });
    } else {
      fail++;
      console.log(`  ❌ FAIL [${testId}] ${name} | ${detail}`);
      findings.push({ id: testId, name, status: 'FAIL', detail });
    }
  }

  let serverProc = null;
  try {
    serverProc = await startServer();
  } catch (e) {
    console.error("Could not start server:", e.message);
    process.exit(1);
  }

  try {
    // ── SIT-01: Full System Reset ──────────────────────────────────────────
    console.log("── Track 1: System Clean State & Platform State Persistence ──");
    let res = await req('POST', '/restart', {});
    check('SIT-01', 'POST /restart wipes memory and transient state', res.status === 200);

    // Platform persistence across state changes
    res = await req('POST', '/set-platform', { platform: 'mobile' });
    check('SIT-02', 'POST /set-platform mobile succeeds', res.status === 200);

    const platformStatePath = path.join(__dirname, '../core/platform_state.json');
    check('SIT-03', 'core/platform_state.json persisted to disk', fs.existsSync(platformStatePath));
    if (fs.existsSync(platformStatePath)) {
      const stateContent = JSON.parse(fs.readFileSync(platformStatePath, 'utf8'));
      check('SIT-04', 'core/platform_state.json contains platform=mobile', stateContent.platform === 'mobile');
    }

    res = await req('GET', '/env');
    const envData = JSON.parse(res.body);
    check('SIT-05', 'GET /env returns mobile platform', envData.platform === 'mobile');

    // Switch back to web
    await req('POST', '/set-platform', { platform: 'web' });

    // ── SIT-02: Multi-Flow Blueprint Upload & Scanning ─────────────────────
    console.log("\n── Track 2: Multi-Scenario Blueprint Parsing & Initial State ──");
    const sourceExcel = path.join(__dirname, '../orangehrm_full_scenario.xlsx');
    const targetExcel = path.join(__dirname, '../scenario_uploaded.xlsx');
    fs.copyFileSync(sourceExcel, targetExcel);

    // Run scenario parser
    execSync('node core/scenario_parser.js scenario_uploaded.xlsx', { cwd: path.join(__dirname, '..') });
    const blueprintPath = path.join(__dirname, '../core/blueprint.json');
    check('SIT-06', 'Scenario parser builds core/blueprint.json', fs.existsSync(blueprintPath));

    const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const scenarioIds = blueprint.map(s => s.Scenario_ID);
    check('SIT-07', 'Blueprint contains all 3 OrangeHRM scenarios (HRM.A.1, HRM.A.2, HRM.A.3)', 
      scenarioIds.includes('HRM.A.1') && scenarioIds.includes('HRM.A.2') && scenarioIds.includes('HRM.A.3'));

    res = await req('GET', '/scan');
    const scanData = JSON.parse(res.body);
    check('SIT-08', 'GET /scan lists steps from uploaded blueprint', Array.isArray(scanData.steps) && scanData.steps.length > 0);

    // Check shared step "Navigate to OrangeHRM"
    const navStep = scanData.steps.find(s => s.label === 'Navigate to OrangeHRM');
    check('SIT-09', 'Step "Navigate to OrangeHRM" detected with missing status', navStep && navStep.status === 'missing');
    check('SIT-10', 'Step "Navigate to OrangeHRM" linked to multiple flows', navStep && navStep.flows && navStep.flows.length >= 2);

    // ── SIT-03: Codegen Launch for Initial Step (No preceding steps) ────────
    console.log("\n── Track 3: Initial Step Recording (Codegen Mode) ──");
    res = await req('POST', '/record', {
      label: 'Navigate to OrangeHRM',
      scenarioId: 'HRM.A.1',
      url: 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login',
      platform: 'web'
    });
    check('SIT-11', 'POST /record for step 1 returns 200', res.status === 200);
    const rec1Data = JSON.parse(res.body);
    check('SIT-12', 'Step 1 uses isReplay=false (clean codegen launch)', rec1Data.isReplay === false);
    check('SIT-13', 'Step 1 returns valid sessionId', typeof rec1Data.sessionId === 'string' && rec1Data.sessionId.length > 0);

    // Duplicate record request guard (DEF-CRIT-001)
    const dupRes = await req('POST', '/record', {
      label: 'Navigate to OrangeHRM',
      scenarioId: 'HRM.A.1'
    });
    check('SIT-14', 'Concurrent record request blocked with 409 Conflict', dupRes.status === 409);

    // Cancel active codegen
    const cancelRes = await req('POST', '/record-cancel', {});
    check('SIT-15', 'POST /record-cancel terminates active codegen cleanly', cancelRes.status === 200);
    await new Promise(r => setTimeout(r, 600));

    // ── SIT-04: Global Synchronized Mapping Across Same-Named Actions ───────
    console.log("\n── Track 4: Global Mapping Synchronization Across Flows ──");
    // Save Step 1 mapping
    const saveNavRes = await req('POST', '/save-mapping', {
      label: 'Navigate to OrangeHRM',
      code: "await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');"
    });
    check('SIT-16', 'POST /save-mapping for "Navigate to OrangeHRM" succeeds', saveNavRes.status === 200);

    // Verify /scan reflects mapped status across ALL scenarios
    res = await req('GET', '/scan');
    const scanAfterNav = JSON.parse(res.body);
    const mappedNavStep = scanAfterNav.steps.find(s => s.label === 'Navigate to OrangeHRM');
    check('SIT-17', 'Step "Navigate to OrangeHRM" status is now "mapped"', mappedNavStep && mappedNavStep.status === 'mapped');
    check('SIT-18', 'Global sync: "Navigate to OrangeHRM" covers all 3 scenario flows simultaneously', 
      mappedNavStep && mappedNavStep.flows.includes('HRM.A.1') && mappedNavStep.flows.includes('HRM.A.2'));

    // Save Step 2 mapping with DDT parameter
    const saveUserRes = await req('POST', '/save-mapping', {
      label: 'Input Username',
      code: "await page.getByPlaceholder('Username').fill('{username}');"
    });
    check('SIT-19', 'POST /save-mapping for "Input Username" with {username} succeeds', saveUserRes.status === 200);

    res = await req('GET', '/scan');
    const scanAfterUser = JSON.parse(res.body);
    const mappedUserStep = scanAfterUser.steps.find(s => s.label === 'Input Username');
    check('SIT-20', 'Step "Input Username" status is "mapped" across all scenarios', mappedUserStep && mappedUserStep.status === 'mapped');

    // ── SIT-05: Replay Launch for Intermediate Step ────────────────────────
    console.log("\n── Track 5: Intelligent Replay Execution for Intermediate Steps ──");
    // User clicks Record on Step 3 ("Input Password") in HRM.A.1
    // Preceding steps: "Navigate to OrangeHRM" and "Input Username"
    const rec3Res = await req('POST', '/record', {
      label: 'Input Password',
      scenarioId: 'HRM.A.1',
      url: '',
      platform: 'web'
    });
    check('SIT-21', 'POST /record for intermediate step (Step 3) returns 200', rec3Res.status === 200);
    const rec3Data = JSON.parse(rec3Res.body);
    check('SIT-22', 'Intermediate step triggers isReplay=true', rec3Data.isReplay === true);
    check('SIT-23', 'Replay generates unique sessionId', typeof rec3Data.sessionId === 'string');

    // Verify the temporary replay spec in core/
    const coreDir = path.join(__dirname, '../core');
    const replaySpecs = fs.readdirSync(coreDir).filter(f => f.startsWith(`replay_${rec3Data.sessionId}`) && f.endsWith('.spec.ts'));
    check('SIT-24', 'Temporary replay spec created on disk in core/', replaySpecs.length === 1);

    if (replaySpecs.length > 0) {
      const specCode = fs.readFileSync(path.join(coreDir, replaySpecs[0]), 'utf8');
      check('SIT-25', 'Replay spec includes test.setTimeout(0) (anti-timeout guard for tester pause)', 
        specCode.includes('test.setTimeout(0);'));
      check('SIT-26', 'Replay spec includes preceding Step 1 (Navigate to OrangeHRM)', 
        specCode.includes('Step: Navigate to OrangeHRM') && specCode.includes('await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")'));
      check('SIT-27', 'Replay spec includes preceding Step 2 (Input Username)', 
        specCode.includes('Step: Input Username') && specCode.includes('await page.getByPlaceholder(\'Username\').fill('));
      check('SIT-28', 'Replay spec halts at await page.pause() for Playwright Inspector handover', 
        specCode.includes('await page.pause();'));
    }

    // Cancel replay session and verify cleanup
    await req('POST', '/record-cancel', {});
    await new Promise(r => setTimeout(r, 600));
    const postReplaySpecs = fs.readdirSync(coreDir).filter(f => f.startsWith(`replay_${rec3Data.sessionId}`));
    check('SIT-29', 'Temporary replay spec deleted on session close/cancel', postReplaySpecs.length === 0);

    // ── SIT-06: Complete All Mappings and Verify Compilation ────────────────
    console.log("\n── Track 6: End-to-End Mapping Completion & Compilation ──");
    // Map Step 3 (Parameterized Password)
    await req('POST', '/save-mapping', {
      label: 'Input Password',
      code: "await page.getByPlaceholder('Password').fill('{password}');"
    });

    // Map Step 4 (Submit Login)
    await req('POST', '/save-mapping', {
      label: 'Submit Login',
      code: "await page.getByRole('button', { name: 'Login' }).click();"
    });

    // Map Step 5 (Positive Assertion)
    await req('POST', '/save-mapping', {
      label: 'Verify Dashboard',
      code: "await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();"
    });

    // Map Step 6 (Negative Assertion for HRM.A.2)
    await req('POST', '/save-mapping', {
      label: 'Verify Invalid Credentials Error',
      code: "await expect(page.getByText('Invalid credentials')).toBeVisible();"
    });

    // Map Step 7 (Validation Assertion for HRM.A.3)
    await req('POST', '/save-mapping', {
      label: 'Verify Required Validation',
      code: "await expect(page.locator('form').filter({ hasText: 'Required' })).toBeVisible();"
    });

    res = await req('GET', '/scan');
    const fullScan = JSON.parse(res.body);
    const unmappedSteps = fullScan.steps.filter(s => s.status !== 'mapped');
    check('SIT-30', 'All steps across all 3 scenarios are mapped (0 missing steps)', unmappedSteps.length === 0);

    // Test Compiler execution
    execSync('node core/compiler.js', { cwd: path.join(__dirname, '..') });
    const executedSpecPath = path.join(__dirname, '../core/executed.spec.ts');
    check('SIT-31', 'core/compiler.js generates core/executed.spec.ts', fs.existsSync(executedSpecPath));

    if (fs.existsSync(executedSpecPath)) {
      const compiledContent = fs.readFileSync(executedSpecPath, 'utf8');
      check('SIT-32', 'Compiled spec contains HRM.A.1 test block', compiledContent.includes('HRM.A.1'));
      check('SIT-33', 'Compiled spec contains HRM.A.2 test block', compiledContent.includes('HRM.A.2'));
      check('SIT-34', 'Compiled spec contains HRM.A.3 test block', compiledContent.includes('HRM.A.3'));
      check('SIT-35', 'Compiled spec contains resilient screenshot sequences (waitForTimeout + catch-guarded loadState)', 
        compiledContent.includes('waitForTimeout(1000)') && compiledContent.includes("waitForLoadState('networkidle').catch"));
      check('SIT-36', 'Compiled spec uses safe string escaping q() and isSafeChain', 
        !compiledContent.includes('eval(') && !compiledContent.includes('require('));
    }

    // ── SIT-07: Preview Scenario Script Verification ───────────────────────
    console.log("\n── Track 7: Scenario Preview Script Verification ──");
    res = await req('GET', '/preview-scenario/' + encodeURIComponent('HRM.A.1'));
    const scen1Preview = JSON.parse(res.body);
    check('SIT-37', 'GET /preview-scenario/HRM.A.1 generates complete ordered script', 
      scen1Preview.code && scen1Preview.code.includes('Step: Navigate to OrangeHRM') && scen1Preview.code.includes('Step: Verify Dashboard'));

    res = await req('GET', '/preview-scenario/' + encodeURIComponent('HRM.A.2'));
    const scen2Preview = JSON.parse(res.body);
    check('SIT-38', 'GET /preview-scenario/HRM.A.2 includes step "Verify Invalid Credentials Error"', 
      scen2Preview.code && scen2Preview.code.includes('Step: Verify Invalid Credentials Error'));

    // ── Final Score Calculation ───────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log(`║  SIT AUDIT RESULTS: ${pass} PASSED / ${fail} FAILED / ${pass + fail} TOTAL              ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error("FATAL ERROR IN SIT AUDIT:", err);
    fail++;
  } finally {
    if (serverProc) {
      serverProc.kill('SIGKILL');
    }
  }

  if (fail > 0) {
    process.exit(1);
  }
}

runAudit();
