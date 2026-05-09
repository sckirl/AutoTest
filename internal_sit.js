const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const PORT = 3100;

async function request(path, options = {}) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function run() {
  const server = spawn('node', ['studio/server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) }
  });
  let booted = false;

  server.stdout.on('data', (d) => {
    if (String(d).includes(`Studio Live on ${PORT}`)) booted = true;
  });
  server.stderr.on('data', (d) => process.stderr.write(String(d)));

  for (let i = 0; i < 20 && !booted; i++) await wait(300);
  if (!booted) throw new Error('Server did not boot');

  const checks = [];

  checks.push(await request('/run-status'));
  checks.push(await request('/save-mapping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: 'X', code: '' })
  }));
  checks.push(await request('/restart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clearMappings: false })
  }));
  checks.push(await request('/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workers: 2, fullyParallel: true })
  }));
  await wait(1000);
  checks.push(await request('/run-status'));
  checks.push(await request('/mapping/Navigate%20to%20OrangeHRM'));

  server.kill('SIGTERM');

  const assertions = [
    checks[0].ok,
    checks[1].status === 400,
    checks[2].ok,
    checks[3].ok,
    ['blueprint', 'compile', 'playwright', 'failed', 'queued'].includes(checks[4].data.phase),
    checks[5].ok
  ];

  const passed = assertions.filter(Boolean).length;
  const total = assertions.length;
  console.log(JSON.stringify({ passed, total, checks }, null, 2));
  process.exit(passed === total ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
