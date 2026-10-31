import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const entry = JSON.parse(fs.readFileSync(path.join(root, 'submission/entry.json'), 'utf8'));
const missing = [];
if (!entry.title?.trim()) missing.push('project title');
if (!entry.description?.trim() || entry.description.length > 500) missing.push('description of 1-500 characters');
if (entry.shareToShowcase !== true) missing.push('Share to Showcase for challenge entry (human must review)');
try {
  const url = new URL(entry.projectUrl);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || host === 'localhost' || host.includes(':') ||
      /(^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
      host.endsWith('.local') || host.endsWith('.internal')) throw new Error();
} catch { missing.push('actual public HTTPS game URL'); }
if (!entry.coverImage) missing.push('cover screenshot (at least 1200px wide; 3:2 recommended)');
else {
  const cover = path.resolve(root, entry.coverImage);
  const relative = path.relative(root, cover);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(cover)) missing.push('existing project-local cover file');
  else {
    const bytes = fs.readFileSync(cover);
    let width = 0, height = 0;
    if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
    } else if (bytes[0] === 255 && bytes[1] === 216) {
      for (let i = 2; i + 9 < bytes.length;) {
        if (bytes[i] !== 255) break;
        const marker = bytes[i + 1], length = bytes.readUInt16BE(i + 2);
        if ([192, 193, 194].includes(marker)) { height = bytes.readUInt16BE(i + 5); width = bytes.readUInt16BE(i + 7); break; }
        if (length < 2) break;
        i += 2 + length;
      }
    }
    if (width < 1200 || !height) missing.push('readable PNG/JPEG cover at least 1200px wide');
    else if (Math.abs(width / height - 1.5) > .01) console.log('NOTE: cover is not the recommended 3:2 ratio.');
  }
}
if (!entry.verification?.publicHealthAndAssets) missing.push('public health/assets verification');
// Preparation is distinct from the owner's eligibility attestations and submission.
// The owner explicitly waived a physical playtest; never turn that into a test pass.
if (!entry.verification?.automatedQaEntry || !fs.readFileSync(path.join(root, 'QA_LOG.md'), 'utf8').includes(entry.verification.automatedQaEntry)) missing.push('recorded automated QA evidence');
if (!entry.verification?.twoSeparateDevicesAndNetworks && entry.verification?.ownerWaivedPhysicalPlaytest !== true) missing.push('physical playtest or explicit owner waiver');
if (!entry.verification?.twoSeparateDevicesAndNetworks) console.log('LIMITATION: separate physical-device/network playtest not performed; owner waived this preparation gate.');
if (!entry.verification?.humanReviewed) console.log('PERSONAL STEP: owner reviews eligibility, entry and deadline when submitting.');
console.log(`Description: ${entry.description?.length || 0}/500 characters.`);
if (missing.length) {
  console.log('PREPARATION INCOMPLETE. Still required:');
  for (const item of missing) console.log(`- ${item}`);
  process.exitCode = 1;
} else console.log('SUBMISSION PACKAGE READY. Required assets and automated evidence present. No entry submitted; personal eligibility/review remains with owner.');
