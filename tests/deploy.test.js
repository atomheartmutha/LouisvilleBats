import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const localScript = readFileSync(new URL('scripts/deploy-vultr.sh', root), 'utf8');
const remoteScript = readFileSync(new URL('scripts/deploy-vultr-remote.sh', root), 'utf8');
const workflow = readFileSync(new URL('.github/workflows/deploy-vultr.yml', root), 'utf8');
const dockerfile = readFileSync(new URL('Dockerfile', root), 'utf8');
const compose = readFileSync(new URL('docker-compose.yml', root), 'utf8');

test('Vultr deployment scripts are valid shell', () => {
  for (const script of ['scripts/deploy-vultr.sh', 'scripts/deploy-vultr-remote.sh']) {
    const result = spawnSync('bash', ['-n', new URL(script, root).pathname], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('deploy runs only after successful main push tests and checks out that exact commit', () => {
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /vars\.VULTR_DEPLOY_ENABLED == 'true'/);
  assert.match(workflow, /conclusion == 'success'/);
  assert.match(workflow, /event == 'push'/);
  assert.match(workflow, /head_branch == 'main'/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(workflow, /GITHUB_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
});

test('deploy uses a dedicated secret, pinned host key and excludes production environment', () => {
  assert.match(workflow, /secrets\.VULTR_SSH_PRIVATE_KEY/);
  assert.match(workflow, /deploy\/known_hosts/);
  assert.doesNotMatch(workflow, /StrictHostKeyChecking=no/);
  assert.match(localScript, /--exclude='\.env'/);
  assert.match(remoteScript, /APP_ROOT\}\/.env/);
});

test('deployment fails when Docker or either health check fails', () => {
  assert.match(localScript, /set -euo pipefail/);
  assert.match(localScript, /docker compose version/);
  assert.match(localScript, /curl --fail/);
  assert.match(remoteScript, /exit 1/);
  assert.doesNotMatch(localScript + remoteScript, /health[^\n]*\|\| true/i);
});

test('container health checks use IPv4 loopback to match the Node server binding', () => {
  assert.match(dockerfile, /127\.0\.0\.1:3000\/api\/health/);
  assert.match(compose, /127\.0\.0\.1:3000\/api\/health/);
  assert.doesNotMatch(dockerfile + compose, /localhost:3000\/api\/health/);
});
