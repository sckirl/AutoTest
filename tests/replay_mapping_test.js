const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 }
    };
    const r = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  console.log("Running script replay & clean mappings verification tests...");
  let pass = 0, fail = 0;
  
  function check(name, cond, detail) {
    if (cond) {
      pass++;
      console.log(`  PASS ${name}`);
    } else {
      fail++;
      console.log(`  FAIL ${name} | ${detail || ''}`);
    }
  }

  // 1. Reset system
  await req('POST', '/restart', {});

  // 2. Mock an uploaded Excel and generate blueprint
  const uploadPath = path.join(__dirname, '..', 'orangehrm_full_scenario.xlsx');
  const mockExcelPath = path.join(__dirname, '..', 'scenario_uploaded.xlsx');
  fs.copyFileSync(uploadPath, mockExcelPath);

  // Trigger scenario parser to generate the correct blueprint
  execSync('node core/scenario_parser.js scenario_uploaded.xlsx', { cwd: path.join(__dirname, '..') });

  // Verify blueprint is created
  const blueprintPath = path.join(__dirname, '..', 'core', 'blueprint.json');
  check('Blueprint generated', fs.existsSync(blueprintPath));

  // Save some mock mappings
  await req('POST', '/save-mapping', {
    label: 'Navigate to OrangeHRM',
    code: "await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');"
  });

  await req('POST', '/save-mapping', {
    label: 'Input Username',
    code: "await page.getByPlaceholder('Username').fill('Admin');"
  });

  // Now, request a record session for a later step (e.g. 'Input Password')
  // This step has 'Navigate to OrangeHRM' and 'Input Username' as preceding steps
  const recordRes = await req('POST', '/record', {
    label: 'Input Password',
    scenarioId: 'HRM.A.1',
    url: '',
    platform: 'web'
  });

  check('Record endpoint responded with 200', recordRes.status === 200);
  const data = JSON.parse(recordRes.body);
  check('Record indicates isReplay: true', data.isReplay === true);
  check('Session ID returned', !!data.sessionId);

  // Check if replay spec file was generated
  const coreDir = path.join(__dirname, '..', 'core');
  const replayFiles = fs.readdirSync(coreDir).filter(f => f.startsWith(`replay_${data.sessionId}`));
  check('Replay spec file created in core/', replayFiles.length > 0);

  if (replayFiles.length > 0) {
    const specContent = fs.readFileSync(path.join(coreDir, replayFiles[0]), 'utf8');
    check('Spec includes Step 1 annotation', specContent.includes('Step: Navigate to OrangeHRM'));
    check('Spec includes Step 2 annotation', specContent.includes('Step: Input Username'));
    check('Spec includes goto command', specContent.includes('await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"'));
    check('Spec includes fill username command', specContent.includes('await page.getByPlaceholder(\'Username\').fill("Admin")'));
    check('Spec includes page.pause()', specContent.includes('await page.pause()'));
  }

  // Cancel the record session to clean up the spawned test process and the spec file
  await req('POST', '/record-cancel', {});

  // Wait a moment for process to close and clean up
  await new Promise(r => setTimeout(r, 1000));
  const postReplayFiles = fs.readdirSync(coreDir).filter(f => f.startsWith(`replay_${data.sessionId}`));
  check('Replay spec file cleaned up after cancellation', postReplayFiles.length === 0);

  // Regression: a step mapped only via the Action Library (not a direct mappings.json entry)
  // must still be included in the preceding-steps replay. /record used to check mappings.json
  // only, silently dropping Library-resolved steps from the replay.
  const actionRes = await req('POST', '/action-db/action', {
    name: 'Input Password',
    code: "await page.getByRole('textbox', { name: 'Password' }).fill('admin123');",
    platform: 'web'
  });
  const actionId = JSON.parse(actionRes.body).action.id;
  await req('POST', '/link-synonym', { excelLabel: 'Input Password', targetType: 'action', targetId: actionId });
  // Remove the earlier direct mappings.json entry for this exact label so only the Library resolves it
  const mappingsPath = path.join(__dirname, '..', 'core', 'mappings.json');
  const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  delete mappings['Input Password'];
  fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));

  const recordRes2 = await req('POST', '/record', { label: 'Submit Login', scenarioId: 'HRM.A.1', url: '', platform: 'web' });
  const data2 = JSON.parse(recordRes2.body);
  check('Second record call also replays (isReplay: true)', data2.isReplay === true);
  const replayFiles2 = fs.readdirSync(coreDir).filter(f => f.startsWith(`replay_${data2.sessionId}`));
  if (replayFiles2.length > 0) {
    const specContent2 = fs.readFileSync(path.join(coreDir, replayFiles2[0]), 'utf8');
    check('Replay includes a Library-only-mapped preceding step', specContent2.includes('Step: Input Password'));
    // Note: exact locator not asserted here, name-collision-safe. A pre-existing Library action
    // literally named "Input Password" (persistent, from prior sessions) resolves first by exact
    // name match ahead of our synonym link, so the resolved code will legitimately vary by
    // whatever's already in this machine's action_database.json. What matters (and what the bug
    // was) is that a Library-only mapping shows up in the replay at all.
  } else {
    check('Replay includes a Library-only-mapped preceding step', false, 'no replay spec file was generated');
  }
  await req('POST', '/record-cancel', {});
  await req('DELETE', `/action-db/action/${actionId}`, {});

  console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
  if (fail > 0) {
    process.exit(1);
  }
}

run().catch(e => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
