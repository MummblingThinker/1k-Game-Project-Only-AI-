import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const boardPath = path.join(root, 'TASK_LIST.md');
const logPath = path.join(root, 'QA_LOG.md');
const board = fs.readFileSync(boardPath, 'utf8');
const qaLog = fs.readFileSync(logPath, 'utf8');
const lines = board.split(/\r?\n/);
const errors = [];
let checkedCount = 0;

for (const [index, line] of lines.entries()) {
  const entry = line.match(/^\s*-\s+\[([ xX])\]\s+`([A-Z][A-Z0-9]*-\d{2,})`/);
  if (!entry) continue;
  const [, checked, id] = entry;
  const isChecked = checked.toLowerCase() === 'x';
  const isVerified = /Status:\s*VERIFIED\b/.test(line);
  if (isChecked) checkedCount += 1;
  if (isChecked && !isVerified) errors.push(`Line ${index + 1}: ${id} is checked but not marked Status: VERIFIED.`);
  if (!isChecked && isVerified) errors.push(`Line ${index + 1}: ${id} says Status: VERIFIED but its checkbox is not checked.`);
  if ((isChecked || isVerified) && !qaLog.includes(id)) {
    errors.push(`Line ${index + 1}: ${id} is marked verified but no evidence mentioning it was found in QA_LOG.md.`);
  }
}

assert.ok(checkedCount >= 1, 'Expected at least one verified baseline check in the task list.');
if (errors.length) {
  console.error('Task board verification FAILED:\n- ' + errors.join('\n- '));
  process.exitCode = 1;
} else {
  console.log(`Task board verification passed: ${checkedCount} checked task(s) have VERIFIED status and QA-log references.`);
}
