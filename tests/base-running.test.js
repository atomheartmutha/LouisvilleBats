import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const sample = vm.runInNewContext(`(${source.slice(source.indexOf('function sampleBasePath('), source.indexOf('  function updateCharacterAnimations()')).trim()})`);

test('home runs touch first, second, third and home in artwork coordinates', () => {
  const bases = [[750, 784], [1314, 606], [745, 520], [193, 602], [750, 784]];
  const scale = 720 / 1538;
  const top = (1023 - 420 / scale) * .35;
  for (let i = 0; i <= 4; i++) {
    const point = sample(4, i / 4);
    assert.ok(Math.abs(point.x - bases[i][0] * scale) < .01);
    assert.ok(Math.abs(point.y - (bases[i][1] - top) * scale) < .01);
  }
});

test('singles and doubles stop on their earned base; each leg stays on the baseline', () => {
  for (const bases of [1, 2, 4]) {
    assert.equal(sample(bases, 1).x, sample(4, bases / 4).x);
    assert.equal(sample(bases, 1).y, sample(4, bases / 4).y);
    for (let leg = 0; leg < bases; leg++) {
      const a = sample(bases, leg / bases), b = sample(bases, (leg + 1) / bases);
      const middle = sample(bases, (leg + .5) / bases);
      assert.ok(Math.abs(middle.x - (a.x + b.x) / 2) < .01);
      assert.ok(Math.abs(middle.y - (a.y + b.y) / 2) < .01);
    }
  }
});

test('runner shrinks with depth, returns to full size, and faces each leg', () => {
  assert.equal(sample(4, 0).scale, 1);
  assert.equal(sample(4, .5).scale, .6);
  assert.equal(sample(4, 1).scale, 1);
  for (let i = 1; i <= 20; i++) {
    assert.ok(sample(4, i / 40).scale < sample(4, (i - 1) / 40).scale);
    assert.ok(sample(4, .5 + i / 40).scale > sample(4, .5 + (i - 1) / 40).scale);
  }
  for (let leg = 0; leg < 4; leg++) {
    const a = sample(4, (leg + .2) / 4), b = sample(4, (leg + .8) / 4);
    assert.ok(Math.abs(a.heading - Math.atan2(b.x - a.x, b.y - a.y)) < .00001);
  }
  assert.equal(new Set([0, 1, 2, 3].map(i => sample(4, (i + .5) / 4).heading)).size, 4);
});
