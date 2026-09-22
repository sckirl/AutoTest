// Spawns the studio server, waits for it, runs the offline test suite, exits with the failure count.
// ponytail: fixed port 3000, since every offline test already hardcodes it — dynamic free-port
// allocation is Phase A1.2's job (server.js:884), not this harness's. Add when CI needs concurrent runs.
const { spawn, execFileSync } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3000;
const OFFLINE_SUITE = ['sweep_test.js', 'run_all_test.js', 'path_traversal_test.js', 'safe_chain_test.js', 'trace_redaction_test.js', 'interpolate_strict_test.js', 'scenario_parser_test.js', 'action_db_corruption_test.js', 'mutual_exclusion_test.js', 'tokenize_literal_test.js', 'mobile_compile_test.js', 'ui_behavior_test.js', 'api_test.js'];

function ping(port) {
  return new Promise(resolve => {
    const r = http.get({ host: 'localhost', port, path: '/env', timeout: 500 }, res => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    r.on('error', () => resolve(false));
    r.on('timeout', () => { r.destroy(); resolve(false); });
  });
}

async function waitForServer(port, { timeoutMs = 10000, intervalMs = 200, serverProcess = null } = {}) {
  const start = Date.now();
  do {
    if (serverProcess && (serverProcess.exitCode !== null || serverProcess.killed)) {
      throw new Error('Server process exited unexpectedly. Use: npm test');
    }
    if (await ping(port)) return;
    await new Promise(r => setTimeout(r, intervalMs));
  } while (Date.now() - start < timeoutMs);
  throw new Error('Server not running. Use: npm test');
}

async function main() {
  // Fail immediately if port is preoccupied so the suite never runs against a stale process
  if (await ping(PORT)) {
    console.error(`Port ${PORT} is already occupied by another process. Stop it before running npm test.`);
    process.exit(1);
  }
  const server = spawn('node', ['studio/server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  let failures = 0;
  try {
    await waitForServer(PORT, { serverProcess: server });
    for (const file of OFFLINE_SUITE) {
      try {
        execFileSync('node', [path.join(__dirname, file)], { stdio: 'inherit' });
      } catch (e) {
        failures++;
      }
    }
  } catch (e) {
    console.error(e.message);
    failures++;
  } finally {
    server.kill('SIGKILL');
  }
  process.exit(failures);
}

module.exports = { waitForServer, ping };
if (require.main === module) main();
