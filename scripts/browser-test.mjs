// CI-only browser dependency: npm install --no-save --package-lock=false playwright.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.BROWSER_BASE_URL || 'http://127.0.0.1:4188';
const child = process.env.BROWSER_BASE_URL ? null : spawn(process.execPath, ['server/server.js'], { env: { ...process.env, PORT: '4188' }, stdio: 'inherit' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const errors = [];
async function pageIn(context) {
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return page;
}
const state = page => page.locator('#game').getAttribute('data-state');
const x = async page => Number(await page.locator('#game').getAttribute('data-player-x'));
async function walk(page, target) {
  await page.locator('#game').focus();
  const direction = await x(page) < target ? 'ArrowRight' : 'ArrowLeft';
  await page.keyboard.down(direction);
  try {
    await page.waitForFunction(({ target, direction }) => {
      const c = document.querySelector('#game');
      return c.dataset.alive === 'false' || c.dataset.state === 'victory' || (direction === 'ArrowRight' ? Number(c.dataset.playerX) >= target : Number(c.dataset.playerX) <= target);
    }, { target, direction }, { timeout: 18000 });
  } finally { await page.keyboard.up(direction); }
  assert.equal(await page.locator('#game').getAttribute('data-alive'), 'true');
}
async function jump(page) {
  await page.keyboard.down('ArrowRight'); await page.keyboard.down('Space');
  await page.waitForTimeout(950);
  await page.keyboard.up('Space'); await page.keyboard.up('ArrowRight');
}
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/health')).ok) break; } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ headless: true });
  console.log(`Browser: ${browser.version()}`);
  await mkdir('artifacts', { recursive: true });
  const soloContext = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  const solo = await pageIn(soloContext);
  await solo.goto(base); await solo.waitForFunction(() => document.querySelector('#game').dataset.state === 'title');
  await solo.locator('#sound-toggle').focus();
  await solo.keyboard.press('Space');
  assert.equal(await solo.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
  await solo.locator('#sound-volume').evaluate(el => { el.value = '17'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await solo.reload();
  assert.equal(await solo.locator('#sound-toggle').getAttribute('aria-pressed'), 'false', 'mute survives reload');
  assert.equal(await solo.locator('#sound-volume').inputValue(), '17', 'volume survives reload');
  await solo.locator('#sound-toggle').click();
  await solo.waitForFunction(() => document.querySelector('#sound-toggle').dataset.audioState === 'running');
  await solo.screenshot({ path: 'artifacts/title.png' });
  await solo.locator('#start-story').click();
  assert.equal(await state(solo), 'cutscene');
  await solo.waitForTimeout(1600);
  const story = await solo.screenshot({ path: 'artifacts/story.jpg', type: 'jpeg', quality: 78 });
  console.log('STORY_BASE64_BEGIN' + story.toString('base64') + 'STORY_BASE64_END');
  for (let i = 0; i < 3; i++) { await solo.locator('#game').focus(); await solo.keyboard.press('Space'); }
  await solo.waitForFunction(() => document.querySelector('#game').dataset.state === 'playing');
  await solo.keyboard.press('Escape'); assert.equal(await state(solo), 'paused');
  await solo.keyboard.press('Escape'); assert.equal(await state(solo), 'playing');
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    await solo.goto(`${base}/?level=${level}`);
    await solo.waitForFunction(level => document.querySelector('#region-badge').textContent.includes(String(level).padStart(2, '0')), level);
    await solo.locator('#game').focus();
    const before = await x(solo); await solo.keyboard.down('ArrowRight'); await solo.waitForTimeout(250); await solo.keyboard.up('ArrowRight');
    assert.ok(await x(solo) > before, `level ${level} controls`);
    if ([5, 10, 15].includes(level)) await solo.screenshot({ path: `artifacts/level-${level}.png` });
  }
  const aContext = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  const bContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const a = await pageIn(aContext), b = await pageIn(bContext);
  await Promise.all([a.goto(base), b.goto(base)]);
  await a.locator('#create-room').click();
  await a.waitForFunction(() => document.querySelector('#game').dataset.room.length === 6);
  const code = await a.locator('#game').getAttribute('data-room');
  await b.locator('#room-code').fill(code); await b.locator('#join-room').click();
  await a.waitForFunction(() => JSON.parse(document.querySelector('#game').dataset.players).length === 2);
  await a.locator('#start-story').click();
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#game').dataset.state === 'playing')));
  await Promise.all([walk(a, 256), walk(b, 256)]);
  await Promise.all([jump(a), jump(b)]);
  await Promise.all([walk(a, 530), walk(b, 520)]);
  await a.keyboard.press('e');
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#game').dataset.switchActive === 'true')));
  const cover = await a.screenshot({ path: 'artifacts/cover.jpg', type: 'jpeg', quality: 78 });
  // Public game-only evidence can be recovered through the connector's text log API.
  // The original image remains in the normal downloadable workflow artifact.
  console.log('COVER_BASE64_BEGIN' + cover.toString('base64') + 'COVER_BASE64_END');
  await Promise.all([walk(a, 900), walk(b, 900)]);
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#game').dataset.state === 'victory')));
  await a.locator('#continue-level').click();
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#region-badge').textContent.includes('LEVEL 02') && document.querySelector('#game').dataset.state === 'playing')));
  await Promise.all([a.locator('#leave-room').click(), b.locator('#leave-room').click()]);
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const phone = await pageIn(mobile); await phone.goto(base + '/?level=1');
  await phone.locator('[data-control=right]').tap();
  await phone.waitForTimeout(300);
  await phone.locator('[data-control=right]').dispatchEvent('pointercancel', { pointerId: 1 });
  await phone.screenshot({ path: 'artifacts/mobile.png' });
  assert.deepEqual(errors, [], `browser errors: ${JSON.stringify(errors)}`);
  console.log('Browser PASS: saved mute/volume and gesture-unlocked AudioContext; title/story/pause; all 15 stage loads and movement; two isolated browser contexts create/join/relay/bridge/victory and shared Level 2 transition; touch cancel; zero console/page errors.');
} finally {
  await browser?.close();
  if (child) child.kill('SIGTERM');
}
