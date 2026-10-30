import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remote = process.env.TEST_BASE_URL?.replace(/\/$/, '');
if (remote && new URL(remote).protocol !== 'https:') throw new Error('Remote tests require HTTPS');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForHealth(baseUrl, child) {
  const deadline = Date.now() + (remote ? 90000 : 5000);
  let lastError;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`Static server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(remote ? 70000 : 5000) });
      if (response.ok) return await response.json();
      lastError = new Error(`Health endpoint returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Static server did not become healthy in time: ${lastError?.message || 'unknown error'}`);
}

const port = remote ? null : await freePort();
const child = remote ? null : spawn(process.execPath, [path.join(root, 'server/static-server.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child?.stdout.on('data', (chunk) => { logs += chunk.toString(); });
child?.stderr.on('data', (chunk) => { logs += chunk.toString(); });
const baseUrl = remote || `http://127.0.0.1:${port}`;

try {
  const health = await waitForHealth(baseUrl, child);
  assert.equal(health.ok, true, 'health endpoint should report ok');
  if (!remote) assert.equal(health.multiplayer, false, 'static server must clearly indicate multiplayer is disabled');
  else assert.equal(health.service, 'tiny-teamwork-server', 'public service must be the multiplayer server');

  const checks = [
    ['/', 'text/html'],
    ['/style.css', 'text/css'],
    ['/js/game.js', 'text/javascript'],
    ['/js/timing.js', 'text/javascript'],
    ['/js/text-ui.js', 'text/javascript'],
    ['/js/campaign.js', 'text/javascript'],
    ['/js/physics.js', 'text/javascript'],
    ['/js/world.js', 'text/javascript'],
    ['/js/art.js', 'text/javascript'],
    ['/js/network.js', 'text/javascript'],
    ['/js/simulation.js', 'text/javascript'],
    ['/js/telemetry.js', 'text/javascript'],
      ['/js/audio.js', 'text/javascript'],
    ['/assets/sprites/human_amber.png', 'image/png'],
    ['/assets/sprites/human_cyan.png', 'image/png'],
    ['/assets/sprites/human_rose.png', 'image/png'],
    ['/assets/sprites/robot_sentinel.png', 'image/png'],
    ['/assets/sprites/robot_flyer.png', 'image/png'],
    ['/assets/sprites/robot_creeper.png', 'image/png'],
    ['/assets/sprites/giant_pursuer.png', 'image/png'],
    ['/assets/sprites/crate.png', 'image/png'],
    ['/assets/sprites/checkpoint_shelter.png', 'image/png'],
    ['/assets/story/story-atlas.png', 'image/png'],
    ['/assets/story/story-details.png', 'image/png'],
  ];

  for (const [route, expectedType] of checks) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} should return HTTP 200`);
    const actualType = response.headers.get('content-type') || '';
    assert.ok(actualType.startsWith(expectedType), `${route} expected ${expectedType}, got ${actualType}`);
    const body = new Uint8Array(await response.arrayBuffer());
    assert.ok(body.length > 0, `${route} should not be empty`);
  }

  const missing = await fetch(`${baseUrl}/definitely-not-a-real-file.txt`);
  assert.equal(missing.status, 404, 'missing static file should return 404');

  console.log(`Smoke tests passed: health route, HTML/CSS/JS modules, ${checks.filter(([route]) => route.endsWith('.png')).length} sprite assets, and 404 handling.`);
} catch (error) {
  console.error(error.stack || error);
  if (logs) console.error('\nStatic server logs:\n' + logs);
  process.exitCode = 1;
} finally {
  if (child) {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 1500).unref();
    });
  }
}
