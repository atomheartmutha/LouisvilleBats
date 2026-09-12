import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_BATS_ROSTER_DATE, getBatsCharacters } from '../src/mlbApi.js';

test('dugout draft stays playable when Vultr cannot reach MLB Stats', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));

  const roster = await getBatsCharacters();

  assert.equal(roster.source, 'mlb-snapshot');
  assert.equal(roster.fetchedAt, FALLBACK_BATS_ROSTER_DATE);
  assert.equal(roster.characters.length, 21);
  assert.ok(roster.characters.every(player => Number.isInteger(player.id)));
  assert.ok(roster.characters.every(player => player.fullName && player.jerseyNumber && player.primaryPosition));
  assert.ok(roster.characters.every(player => player.source.endsWith(String(player.id))));
  assert.equal(roster.characters[0].fullName, 'Dayne Leonard');
  assert.ok(roster.characters.some(player => player.fullName === 'Edwin Arroyo'));
  assert.ok(roster.characters.every(player => !/Buddy Bat|Mascot/i.test(player.fullName)));
});
