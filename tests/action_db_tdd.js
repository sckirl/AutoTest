/**
 * TDD Test Suite: Persistent Action Database, Synonyms, and Action Groups
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

function check(id, title, condition) {
  if (condition) {
    console.log(`  PASS [${id}] ${title}`);
    passed++;
  } else {
    console.error(`  FAIL [${id}] ${title}`);
    failed++;
  }
}

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method,
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

async function runTdd() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(' TDD SUITE: ACTION DATABASE, SYNONYMS & ACTION GROUPS');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const ActionDB = require('../core/action_db');

  // ── Track 1: ActionDB Unit Operations ───────────────────────────────────
  console.log('── Track 1: Action Database Unit Operations ──');
  const dbPath = path.join(__dirname, '../core/action_database.json');
  
  // Clean initialization
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  ActionDB.init();

  check('TDD-01', 'Database file created on init', fs.existsSync(dbPath));

  // Add Action 1: Navigate
  const act1 = ActionDB.saveAction({
    name: 'Navigate to URL',
    description: 'Open a target web page',
    code: "await page.goto('{url}');",
    synonyms: ['Go to URL', 'Open Page', 'Visit Website'],
    platform: 'web'
  });
  check('TDD-02', 'Action 1 saved with unique ID', act1 && typeof act1.id === 'string');
  check('TDD-03', 'Action 1 extracted {url} variable', act1.variables && act1.variables.includes('url'));

  // Add Action 2: Input Username
  const act2 = ActionDB.saveAction({
    name: 'Input Username',
    description: 'Fill user identifier',
    code: "await page.getByPlaceholder('Username').fill('{username}');",
    synonyms: ['Type Username', 'Enter User', 'Provide User'],
    platform: 'web'
  });
  check('TDD-04', 'Action 2 saved with synonyms', act2.synonyms && act2.synonyms.includes('Type Username'));

  // Add Action 3: Input Password
  const act3 = ActionDB.saveAction({
    name: 'Input Password',
    description: 'Fill user password',
    code: "await page.getByPlaceholder('Password').fill('{password}');",
    synonyms: ['Type Password', 'Enter Password', 'Fill Password'],
    platform: 'web'
  });

  // Add Action 4: Submit Button
  const act4 = ActionDB.saveAction({
    name: 'Submit Login',
    description: 'Click login button',
    code: "await page.getByRole('button', { name: 'Login' }).click();",
    synonyms: ['Click Login', 'Press Login Button'],
    platform: 'web'
  });

  // ── Track 2: Synonym Resolution ─────────────────────────────────────────
  console.log('\n── Track 2: Synonym Resolution ──');
  const foundByCanon = ActionDB.resolveAction('Input Username');
  check('TDD-05', 'Resolve action by canonical name', foundByCanon && foundByCanon.id === act2.id);

  const foundBySyn = ActionDB.resolveAction('Enter User');
  check('TDD-06', 'Resolve action by synonym "Enter User"', foundBySyn && foundBySyn.id === act2.id);

  const foundBySyn2 = ActionDB.resolveAction('Visit Website');
  check('TDD-07', 'Resolve action by synonym "Visit Website"', foundBySyn2 && foundBySyn2.id === act1.id);

  // ── Track 3: Action Groups / Chains (Folder Grouping) ───────────────────
  console.log('\n── Track 3: Action Groups / Chains ──');
  const loginGroup = ActionDB.saveGroup({
    name: 'Standard Login Flow',
    description: 'Complete authentication sequence from navigation to submit',
    actionIds: [act1.id, act2.id, act3.id, act4.id],
    synonyms: ['Login Chain', 'Authentication Sequence', 'Perform Login']
  });

  check('TDD-08', 'Action Group saved with unique ID', loginGroup && typeof loginGroup.id === 'string');
  check('TDD-09', 'Action Group aggregates all 3 variables: url, username, password', 
    loginGroup.variables && loginGroup.variables.includes('url') && loginGroup.variables.includes('username') && loginGroup.variables.includes('password'));

  const resolvedGroup = ActionDB.resolveGroup('Standard Login Flow');
  check('TDD-10', 'Resolve group by canonical name', resolvedGroup && resolvedGroup.id === loginGroup.id);

  const resolvedGroupBySyn = ActionDB.resolveGroup('Perform Login');
  check('TDD-11', 'Resolve group by synonym "Perform Login"', resolvedGroupBySyn && resolvedGroupBySyn.id === loginGroup.id);

  const groupSteps = ActionDB.getGroupSteps(loginGroup.id);
  check('TDD-12', 'getGroupSteps returns ordered list of 4 executable actions', groupSteps && groupSteps.length === 4);

  // ── Track 4: Server API Endpoints ───────────────────────────────────────
  console.log('\n── Track 4: Server REST API Verification ──');
  let res = await req('GET', '/action-db');
  check('TDD-13', 'GET /action-db returns 200', res.status === 200);
  const dbData = JSON.parse(res.body);
  check('TDD-14', 'GET /action-db returns actions and groups arrays', 
    Array.isArray(dbData.actions) && Array.isArray(dbData.groups) && dbData.actions.length >= 4);

  // Link Synonym API
  res = await req('POST', '/link-synonym', {
    excelLabel: 'Enter User Credentials',
    targetType: 'group',
    targetId: loginGroup.id
  });
  check('TDD-15', 'POST /link-synonym links excel label to group', res.status === 200);

  res = await req('GET', '/action-db');
  const updatedDb = JSON.parse(res.body);
  const grp = updatedDb.groups.find(g => g.id === loginGroup.id);
  check('TDD-16', 'Linked synonym persisted in group synonyms', grp && grp.synonyms.includes('Enter User Credentials'));

  // ── Track 5: Compiler Integration ───────────────────────────────────────
  console.log('\n── Track 5: Compiler Integration with Action Groups ──');
  // Write a blueprint using the synonym "Enter User Credentials"
  const testBlueprint = [
    {
      Scenario_ID: 'TDD.1',
      Role: 'Test Group Execution',
      Flow: [
        {
          Mapping_Key: 'Enter User Credentials',
          Data: {
            url: 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login',
            username: 'Admin',
            password: 'admin123'
          }
        }
      ]
    }
  ];
  fs.writeFileSync(path.join(__dirname, '../core/blueprint.json'), JSON.stringify(testBlueprint, null, 2));

  // Run compiler
  execSync('node core/compiler.js', { cwd: path.join(__dirname, '..') });
  const executedSpec = fs.readFileSync(path.join(__dirname, '../core/executed.spec.ts'), 'utf8');

  check('TDD-17', 'Compiler expands group into all 4 sequential steps in executed.spec.ts',
    executedSpec.includes('goto') && executedSpec.includes('Username') && executedSpec.includes('Password') && executedSpec.includes('Login'));
  check('TDD-18', 'Compiler interpolates variables inside grouped actions',
    executedSpec.includes('Admin') && executedSpec.includes('admin123'));

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log(`║  TDD RESULTS: ${passed} PASSED / ${failed} FAILED / ${passed + failed} TOTAL              ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

// If server is not running, spawn it
const { spawn } = require('child_process');
let serverProc = null;

async function main() {
  try {
    await req('GET', '/run-status');
  } catch(e) {
    serverProc = spawn('node', ['studio/server.js'], { cwd: path.join(__dirname, '..') });
    await new Promise(r => setTimeout(r, 2000));
  }

  try {
    await runTdd();
  } finally {
    if (serverProc) serverProc.kill('SIGKILL');
  }
}

main();
