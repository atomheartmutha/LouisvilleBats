import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, chmodSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('pre-commit blocks failures and allows a passing suite', t => {
  const repo = mkdtempSync(join(tmpdir(), 'batyard-hook-test-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  // Git exports index/worktree variables while invoking a hook. Isolate the fixture
  // so this test never stages or commits anything in the developer's checkout.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = '/dev/null';
  const git = (...args) => spawnSync('git', args, { cwd: repo, env, encoding: 'utf8' });
  assert.equal(git('init', '--quiet').status, 0);
  assert.equal(git('config', 'user.name', 'Hook Test').status, 0);
  assert.equal(git('config', 'user.email', 'hook-test@example.invalid').status, 0);
  assert.equal(git('config', 'core.hooksPath', '.githooks').status, 0);
  mkdirSync(join(repo, '.githooks'));
  copyFileSync(new URL('../.githooks/pre-commit', import.meta.url), join(repo, '.githooks/pre-commit'));
  chmodSync(join(repo, '.githooks/pre-commit'), 0o755);
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ scripts: { test: 'node check.cjs' } }));
  writeFileSync(join(repo, 'check.cjs'), 'process.exit(1);\n');
  assert.equal(git('add', '.').status, 0);
  const failed = git('commit', '-m', 'Must be blocked');
  assert.notEqual(failed.status, 0);
  assert.match(failed.stdout + failed.stderr, /Running regression tests/);
  assert.notEqual(git('rev-parse', '--verify', 'HEAD').status, 0);
  writeFileSync(join(repo, 'check.cjs'), 'process.exit(0);\n');
  assert.equal(git('add', 'check.cjs').status, 0);
  const passed = git('commit', '-m', 'Passing fixture');
  assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  assert.equal(git('rev-parse', '--verify', 'HEAD').status, 0);
});
