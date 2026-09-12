import test from 'node:test';
import assert from 'node:assert/strict';
import { localFacts, validateQuestion, getAdaptiveQuestion } from '../src/questions.js';
import { getBatsCharacters } from '../src/mlbApi.js';

test('rejects invalid answer keys, duplicate choices and school jargon', () => {
  const q = { factId: 'opening', q: localFacts[0].q, options: localFacts[0].options, ans: 0, explanation: 'The ballpark opened in 2000.' };
  assert.ok(validateQuestion(q, localFacts));
  for (const invalid of [{ ans: -1 }, { ans: 4 }, { ans: 1 }, { factId: 'invented' }, { options: ['2000','2000','2010','2020'] }, { q: 'JCPS academic standards question' }]) {
    assert.equal(validateQuestion({ ...q, ...invalid }, localFacts), null);
  }
});

test('live roster, grounded Gemini questions, exclusion and malformed-response fallback', async t => {
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => { delete process.env.GEMINI_API_KEY; });
  let badResponse = false, generationCount = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('/roster')) return { ok: true, json: async () => ({ roster: [{ person: { id: 123, fullName: 'Real Player' }, jerseyNumber: '7', position: { abbreviation: 'OF' } }] }) };
    if (url.includes('/stats?')) return { ok: true, json: async () => ({ stats: [{ splits: [{ player: { id: 123 }, team: { id: 416 }, season: '2026', stat: { homeRuns: 0, avg: '.250', stolenBases: 0 } }] }] }) };
    generationCount++;
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.match(body.input, /Real Player/);
    assert.match(body.input, /milb.com/);
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    const question = { factId: 'opening', q: 'What year welcomed the first season at Louisville Slugger Field?', options: localFacts[0].options, ans: badResponse ? 8 : 0, explanation: 'The first season was in 2000.' };
    return { ok: true, json: async () => ({ steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify([question]) }] }] }) };
  });
  const roster = await getBatsCharacters();
  assert.equal(roster.characters[0].fullName, 'Real Player');
  assert.equal(roster.characters[0].rawStats.homeRuns, 0);
  const first = await getAdaptiveQuestion({ currentTier: 3 });
  assert.equal(first.generated, true);
  assert.equal(first.options[first.ans], '2000');
  badResponse = true;
  const second = await getAdaptiveQuestion({ currentTier: 3, excludeId: first.id });
  assert.equal(second.generated, false);
  assert.notEqual(second.id, first.id);
  assert.equal(second.options.length, 4);
  assert.equal(generationCount, 2);
});
