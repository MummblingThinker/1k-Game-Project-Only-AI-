// Prove the rule suite rejects a wrong life-pool value in an isolated copy.
import assert from 'node:assert/strict';
import {mkdir,readdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve('artifacts','rules-mutation-'+Date.now());
await mkdir(join(root,'public','js'),{recursive:true});await mkdir(join(root,'scripts'),{recursive:true});
for(const file of await readdir('public/js'))if(file.endsWith('.js'))await copyFile(join('public/js',file),join(root,'public/js',file));
await copyFile('scripts/rules-test.mjs',join(root,'scripts/rules-test.mjs'));
await writeFile(join(root,'package.json'),'{"type":"module"}');
const path=join(root,'public/js/simulation.js'),original=await readFile(path,'utf8');
const mutated=original.replace('count <= 1 ? 3 :','count <= 1 ? 4 :');assert.notEqual(mutated,original);
await writeFile(path,mutated);
const result=spawnSync(process.execPath,['scripts/rules-test.mjs'],{cwd:root,encoding:'utf8'});
await writeFile(join(root,'failure.log'),result.stdout+result.stderr);
assert.notEqual(result.status,0,'incorrect heart rule must fail');
assert.match(result.stderr,/heart boundary 1/);
console.log('Mutation PASS: intentionally wrong solo heart pool rejected; isolated fixture retained at',root);
