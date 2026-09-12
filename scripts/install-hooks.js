import { existsSync, chmodSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// npm install also runs in Docker/build archives, which do not contain Git metadata.
if (!existsSync(new URL('../.git', import.meta.url))) {
  console.log('No Git checkout; skipping local hook installation.');
} else {
  const current = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: root, encoding: 'utf8' });
  if (current.status !== 0 && current.status !== 1) throw new Error('Could not inspect Git hooks configuration.');
  if (current.stdout.trim() && current.stdout.trim() !== '.githooks') {
    throw new Error(`Existing hooksPath (${current.stdout.trim()}) must be reconciled before installing .githooks.`);
  }
  chmodSync(new URL('../.githooks/pre-commit', import.meta.url), 0o755);
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], { cwd: root });
  console.log('Pre-commit test hook installed.');
}
