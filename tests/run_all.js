// Spawns the studio and offline suites with disposable state, data and result roots.
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OFFLINE_SUITE = ['sweep_test.js', 'run_all_test.js', 'path_traversal_test.js', 'safe_chain_test.js', 'trace_redaction_test.js', 'interpolate_strict_test.js', 'scenario_parser_test.js', 'action_db_corruption_test.js', 'mutual_exclusion_test.js', 'tokenize_literal_test.js', 'mobile_compile_test.js', 'ui_behavior_test.js', 'api_test.js', 'upload_test.js', 'state_dir_test.js', 'fixtures_smoke_test.js', 'journey_test.js', 'electron_test.js', 'llm_test.js', 'prompt_test.js', 'cdp_profile_test.js', 'codegen_launch_test.js', 'codegen_result_test.js'];

function ping(port) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path: '/env', timeout: 500 }, res => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForServer(port, { timeoutMs = 10000, intervalMs = 200, serverProcess = null } = {}) {
  const start = Date.now();
  do {
    if (serverProcess && (serverProcess.exitCode !== null || serverProcess.signalCode !== null)) {
      throw new Error('Server process exited unexpectedly. Use: npm test');
    }
    if (await ping(port)) return;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  } while (Date.now() - start < timeoutMs);
  throw new Error('Server not running. Use: npm test');
}

async function startStudio({ env = {}, script = path.join(ROOT, 'studio/server.js'), timeoutMs = 10000 } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-suite-'));
  const childEnv = {
    ...process.env,
    ...env,
    AUTOTEST_STATE_DIR: path.join(root, 'state'),
    AUTOTEST_DATA_DIR: path.join(root, 'data'),
    AUTOTEST_RESULTS_DIR: path.join(root, 'results'),
    AUTOTEST_CDP_PROFILE: 'isolated',
    AUTOTEST_PLATFORM: 'web',
    LLM_BASE_URL: '',
    LLM_API_KEY: '',
    LLM_MODEL: '',
    PORT: '0',
  };
  for (const key of Object.keys(childEnv)) if (/^(OPENAI_API_KEY$|ANTHROPIC_API_KEY$|GEMINI_API_KEY$)/.test(key)) delete childEnv[key];
  for (const key of [childEnv.AUTOTEST_STATE_DIR, childEnv.AUTOTEST_DATA_DIR, childEnv.AUTOTEST_RESULTS_DIR]) fs.mkdirSync(key, { recursive: true });
  const server = spawn(process.execPath, [script], { cwd: ROOT, env: childEnv, stdio: ['ignore', 'pipe', 'inherit'] });
  let output = '';
  let port;
  let readySeen = false;
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const timer = setTimeout(() => readyReject(new Error('Server not running. Use: npm test')), timeoutMs);
  server.stdout.setEncoding('utf8');
  server.stdout.on('data', chunk => {
    if (readySeen) return;
    const buffered = output + chunk;
    const match = buffered.match(/(?:^|\n)STUDIO_PORT=(\d+)(?:\n|$)/);
    if (match) { readySeen = true; port = Number(match[1]); readyResolve(); }
    else output = buffered.slice(-1024);
  });
  server.once('error', readyReject);
  server.once('exit', () => readyReject(new Error('Server process exited unexpectedly. Use: npm test')));

  let stopped = false;
  async function stop() {
    if (stopped) return;
    if (server.exitCode === null && server.signalCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve));
      server.kill('SIGTERM');
      const deadline = new Promise(resolve => { const timer = setTimeout(resolve, 2000); timer.unref(); });
      await Promise.race([exited, deadline]);
      if (server.exitCode === null && server.signalCode === null) {
        const killed = new Promise(resolve => server.once('exit', resolve));
        server.kill('SIGKILL');
        await Promise.race([killed, new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Owned server did not exit after SIGKILL')), 2000); timer.unref(); })]);
      }
    }
    stopped = true;
    fs.rmSync(root, { recursive: true, force: true });
  }

  try {
    await ready;
    clearTimeout(timer);
    if (server.exitCode !== null || server.signalCode !== null || !(await ping(port))) throw new Error('Server process exited unexpectedly. Use: npm test');
    return { port, root, env: childEnv, server, stop };
  } catch (error) {
    clearTimeout(timer);
    await stop();
    throw error;
  }
}

function runSuite(file, env) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(__dirname, file)], { cwd: ROOT, env, stdio: 'inherit' });
    child.once('error', () => resolve(false));
    child.once('exit', code => resolve(code === 0));
  });
}

async function main() {
  let failures = 0;
  let studio;
  try {
    studio = await startStudio();
    const env = { ...studio.env, PORT: String(studio.port) };
    for (const file of OFFLINE_SUITE) if (!(await runSuite(file, env))) failures++;
  } catch (error) {
    console.error(error.message);
    failures++;
  } finally {
    if (studio) await studio.stop();
  }
  process.exitCode = failures;
}

module.exports = { ping, waitForServer, startStudio };
if (require.main === module) main();
