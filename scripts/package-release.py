"""Package only game source; optionally test a fresh extraction without installed dependencies."""
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import os
import shutil
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'release'
output.mkdir(exist_ok=True)
roots = ['public', 'server', 'scripts', 'submission', 'docs']
names = ['package.json', 'package-lock.json', 'render.yaml', '.gitignore', '.github/workflows/public-smoke.yml', 'README.md',
         '.github/workflows/campaign.yml',
         '.github/workflows/browser-campaign.yml',
         '.github/workflows/public-browser.yml',
         '.github/workflows/public-campaign.yml',
         '.github/workflows/public-three-player.yml',
         '.github/workflows/revision.yml', '.github/workflows/revision-public.yml',
         'AGENTS.md', 'CODEX_START_HERE.md', 'PRIORITY_ROADMAP.md', 'TASK_LIST.md', 'QA_LOG.md',
         'docs/DEPLOYMENT.md', 'docs/NETWORKING.md', 'docs/PRACTICE_GUIDE.md',
         'docs/PROJECT_STATUS.md', 'docs/ART_DIRECTION.md', 'docs/ASSET_LICENSES.md']
files = [root / name for name in names]
for directory in roots:
    files.extend(p for p in (root / directory).rglob('*') if p.is_file())
files = sorted(set(files))
files = [p for p in files if not any(part in {'__pycache__', 'node_modules', '.npm-cache', '.git'}
                                   for part in p.relative_to(root).parts)
         and p.name != '.env' and not p.name.startswith('.env.') and p.suffix not in {'.log', '.pyc'}]
archive = output / 'AI-Take-Over-source.zip'
manifest = []
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for path in files:
        data = path.read_bytes()
        name = path.relative_to(root).as_posix()
        bundle.writestr(name, data)
        manifest.append({'path': name, 'sha256': hashlib.sha256(data).hexdigest()})
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None, 'ZIP integrity check failed'
    assert 'package.json' in bundle.namelist()
    assert all(not Path(name).is_absolute() and '..' not in Path(name).parts for name in bundle.namelist())
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'source-manifest.json').write_text(json.dumps({'archive': archive.name, 'sha256': checksum,
                                                       'files': manifest}, indent=2) + '\n', encoding='utf-8')
print(f'ZIP integrity PASS: {len(files)} allowlisted files; no dependencies, caches or environment files.')
if '--verify' in sys.argv:
    # A sibling avoids accidentally resolving this checkout's node_modules via ancestors.
    with TemporaryDirectory(prefix='.source-qa-', dir=root.parent) as temporary:
        extracted = Path(temporary).resolve()
        assert extracted.is_relative_to(root.parent.resolve()) and extracted != root.parent.resolve()
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(extracted)
        assert not (extracted / 'node_modules').exists()
        subprocess.run([shutil.which('node'), '-e',
                        "try { require.resolve('socket.io'); process.exit(1); } catch { console.log('Dependency isolation PASS'); }"],
                       cwd=extracted, check=True)
        subprocess.run(['npm.cmd' if os.name == 'nt' else 'npm', 'test'], cwd=extracted, check=True)
        print('Fresh extraction PASS: npm test without node_modules; live checks explicitly skipped.')
print(f'Archive: {archive}')
print(f'SHA256: {checksum}')
