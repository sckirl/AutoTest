const assert = require('assert');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { waitForServer, startStudio } = require('./run_all');

function getJson(port, route) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: route }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

async function main() {
  const reservation = http.createServer((req, res) => { res.writeHead(404); res.end(); });
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const closedPort = reservation.address().port;
  let threw;
  try {
    await waitForServer(closedPort, { timeoutMs: 300, intervalMs: 50 });
  } catch (error) {
    threw = error;
  } finally {
    await new Promise(resolve => reservation.close(resolve));
  }
  assert.ok(threw, 'waitForServer rejects when the owned endpoint is not Studio');
  assert.strictEqual(threw.message, 'Server not running. Use: npm test');

  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-harness-fixture-'));
  const fixture = path.join(fixtureDir, 'server.js');
  fs.writeFileSync(fixture, `
    const http = require('http');
    const fs = require('fs');
    for (const name of ['AUTOTEST_STATE_DIR', 'AUTOTEST_DATA_DIR', 'AUTOTEST_RESULTS_DIR']) {
      fs.writeFileSync(require('path').join(process.env[name], 'fixture.txt'), 'isolated');
    }
    const server = http.createServer((req, res) => { res.writeHead(req.url === '/env' ? 200 : 404); res.end(); });
    server.listen(process.env.PORT, '127.0.0.1', () => console.log('STUDIO_PORT=' + server.address().port));
  `);
  let studio;
  try {
    studio = await startStudio({ script: fixture });
    assert.ok(studio.port > 0, 'reports the fixture child’s actual dynamic port');
    assert.strictEqual(await require('./run_all').ping(studio.port), true);
    for (const key of ['AUTOTEST_STATE_DIR', 'AUTOTEST_DATA_DIR', 'AUTOTEST_RESULTS_DIR']) {
      assert.ok(studio.env[key].startsWith(studio.root + path.sep), `${key} is isolated under the test root`);
      assert.ok(!studio.env[key].startsWith(path.join(__dirname, '..', 'core')));
      assert.strictEqual(fs.readFileSync(path.join(studio.env[key], 'fixture.txt'), 'utf8'), 'isolated', `${key} is created before spawn`);
    }
    for (const key of ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL']) assert.strictEqual(studio.env[key], '', `${key} is blank for offline children`);
    assert.strictEqual(studio.env.AUTOTEST_CDP_PROFILE, 'isolated');
    assert.strictEqual(studio.env.AUTOTEST_PLATFORM, 'web');
    assert.strictEqual(studio.server.exitCode, null, 'returns the live owned child');
  } finally {
    if (studio) {
      const root = studio.root;
      await studio.stop();
      assert.ok(studio.server.exitCode !== null || studio.server.signalCode !== null, 'stop waits for the owned child to exit');
      assert.strictEqual(fs.existsSync(root), false, 'stop removes the isolated root');
      await assert.rejects(waitForServer(studio.port, { serverProcess: studio.server }), /Server process exited unexpectedly/);
    }
  }

  let realStudio;
  try {
    realStudio = await startStudio({ env: {
      LLM_BASE_URL: 'https://example.invalid/v1', LLM_API_KEY: 'sentinel-secret', LLM_MODEL: 'sentinel-model',
      AUTOTEST_CDP_PROFILE: 'real', AUTOTEST_PLATFORM: 'mobile',
    } });
    assert.deepStrictEqual(await getJson(realStudio.port, '/suggest/status'), { enabled: false, active: false });
    assert.strictEqual(realStudio.env.LLM_API_KEY, '');
    assert.strictEqual(realStudio.env.AUTOTEST_CDP_PROFILE, 'isolated');
    assert.strictEqual(realStudio.env.AUTOTEST_PLATFORM, 'web');
  } finally {
    if (realStudio) await realStudio.stop();
  }

  const failedFixture = path.join(fixtureDir, 'failed.js');
  fs.writeFileSync(failedFixture, 'process.exit(3);');
  let failedRoot;
  const mkdtemp = fs.mkdtempSync;
  fs.mkdtempSync = (...args) => (failedRoot = mkdtemp(...args));
  try {
    await assert.rejects(startStudio({ script: failedFixture }), /Server process exited unexpectedly/);
    assert.strictEqual(fs.existsSync(failedRoot), false, 'failed startup removes its isolated root');
  } finally {
    fs.mkdtempSync = mkdtemp;
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
  console.log('PASS: harness waits for a live owned child, isolates roots, and awaits teardown');
}

main().catch(error => { console.error('FATAL:', error); process.exit(1); });
