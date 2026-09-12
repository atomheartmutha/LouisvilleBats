import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

test('win expectancy formula renders as readable semantic HTML, not raw math macros', () => {
  const formula = html.match(/<p class="saber-desc saber-formula"[\s\S]*?<\/p>/)?.[0] || '';
  assert.match(formula, /Win% = RS<sup>1\.83<\/sup> ÷/);
  assert.match(formula, /RA<sup>1\.83<\/sup>/);
  assert.doesNotMatch(formula, /\$|\\frac|\\text/);
  assert.match(formula, /aria-label=/);
});

test('simulator formats winning percentage to three decimal places', () => {
  assert.match(appSource, /winPct\.toFixed\(3\)\.replace\(\/\^0\//);
  const pct = (680 ** 1.83) / ((680 ** 1.83) + (610 ** 1.83));
  assert.match(pct.toFixed(3).replace(/^0/, ''), /^\.\d{3}$/);
});
