import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const appSource = fs.readFileSync(new URL('public/app.js', root), 'utf8');
const serverSource = fs.readFileSync(new URL('server.js', root), 'utf8');

const soundAssets = [
  'ballpark-organ-charge.mp3',
  'bat-crack.mp3',
  'crowd-home-run.mp3',
  'power-up-chime.mp3'
];

test('ElevenLabs game sound assets are committed as valid MP3 files', () => {
  for (const filename of soundAssets) {
    const asset = new URL(`public/assets/audio/${filename}`, root);
    const bytes = fs.readFileSync(asset);
    assert.ok(bytes.length > 10_000, `${filename} should contain generated audio`);
    assert.equal(bytes.subarray(0, 3).toString(), 'ID3', `${filename} should have an MP3 ID3 header`);
    assert.match(appSource, new RegExp(`assets/audio/${filename.replaceAll('.', '\\.')}`));
  }
  assert.match(serverSource, /'\.mp3': 'audio\/mpeg'/);
});

test('each game sound uses generated audio with an offline synthesis fallback', () => {
  assert.match(appSource, /playGeneratedSfx\('organ', synthesizeBallparkOrganCharge\)/);
  assert.match(appSource, /playGeneratedSfx\('batCrack', synthesizeBatCrack\)/);
  assert.match(appSource, /playGeneratedSfx\('crowd', synthesizeCrowdCheer\)/);
  assert.match(appSource, /playGeneratedSfx\('celebration', synthesizeCelebrationChime\)/);
  assert.match(appSource, /playback\.catch\(\(\) => \{/);
  assert.match(appSource, /typeof Audio !== 'function'/);
});
