import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import handler from '../api/index.js';
import { server } from '../server.js';

test('importing the serverless entry point does not open a listening socket', () => {
  assert.equal(server.listening, false);
  assert.equal(typeof handler, 'function');
});

test('Vercel sends all API paths to the shared native Node handler', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
  assert.deepEqual(config.rewrites, [{ source: '/api/:path*', destination: '/api' }]);
});

test('serverless handler serves health and static assets', async t => {
  const local = createServer(handler);
  await new Promise((resolve, reject) => {
    local.once('error', reject);
    local.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => local.close(resolve)));
  const { port } = local.address();
  const health = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ready');
  const home = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /BATYARD SLUGGER/);
});
