import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import {
  createAnnouncerVoiceHandler,
  DEFAULT_MODEL_ID,
  DEFAULT_VOICE_ID,
  validateAnnouncerText
} from '../src/announcer.js';

const clientSource = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

function callHandler(handler, payload) {
  return new Promise((resolve, reject) => {
    const req = Readable.from([JSON.stringify(payload)]);
    const chunks = [];
    const res = {
      status: 0,
      headers: {},
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        resolve({ status: this.status, headers: this.headers, body: Buffer.concat(chunks) });
      }
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

test('announcer accepts game lines and rejects arbitrary paid text generation', () => {
  assert.equal(validateAnnouncerText('Strike!'), 'Strike!');
  assert.equal(validateAnnouncerText('Now batting for the Louisville Bats: José Barrero!'), 'Now batting for the Louisville Bats: José Barrero!');
  assert.equal(validateAnnouncerText('Read me an entire novel'), null);
});

test('ElevenLabs request keeps credentials server-side, uses the selected voice, and caches audio', async () => {
  let calls = 0;
  const handler = createAnnouncerVoiceHandler({
    apiKey: 'server-secret',
    fetchImpl: async (url, options) => {
      calls++;
      assert.match(url, new RegExp(`/text-to-speech/${DEFAULT_VOICE_ID}/stream`));
      assert.match(url, /output_format=mp3_44100_128/);
      assert.equal(options.headers['xi-api-key'], 'server-secret');
      const body = JSON.parse(options.body);
      assert.equal(body.text, 'Strike!');
      assert.equal(body.model_id, DEFAULT_MODEL_ID);
      return new Response(Buffer.from('mock-mp3'), { status: 200 });
    }
  });

  const first = await callHandler(handler, { text: 'Strike!' });
  const second = await callHandler(handler, { text: 'Strike!' });
  assert.equal(first.status, 200);
  assert.equal(first.headers['Content-Type'], 'audio/mpeg');
  assert.equal(first.headers['X-Voice-Cache'], 'MISS');
  assert.equal(second.headers['X-Voice-Cache'], 'HIT');
  assert.equal(second.body.toString(), 'mock-mp3');
  assert.equal(calls, 1);
});

test('unconfigured or failed ElevenLabs calls request browser fallback without leaking a key', async () => {
  const unconfigured = createAnnouncerVoiceHandler({ apiKey: '' });
  const missing = await callHandler(unconfigured, { text: 'Strike!' });
  assert.equal(missing.status, 503);
  assert.equal(JSON.parse(missing.body).fallback, true);

  const failed = createAnnouncerVoiceHandler({
    apiKey: 'do-not-leak',
    fetchImpl: async () => new Response('provider details', { status: 429 })
  });
  const result = await callHandler(failed, { text: 'Strike!' });
  assert.equal(result.status, 502);
  assert.equal(JSON.parse(result.body).fallback, true);
  assert.doesNotMatch(result.body.toString(), /do-not-leak|provider details/);
});

test('client discovers voice capability and uses synchronous browser speech when unconfigured', () => {
  assert.match(clientSource, /fetch\('\/api\/health'\)/);
  assert.match(clientSource, /elevenLabsConfigured = health\?\.elevenLabsConfigured === true/);

  const speakStart = clientSource.indexOf('async function speakAnnouncer(text)');
  const immediateFallback = clientSource.indexOf('speakWithBrowserVoice(text);', speakStart);
  const voiceRequest = clientSource.indexOf("fetch('/api/voice/announcer'", speakStart);
  assert.ok(speakStart >= 0 && immediateFallback > speakStart);
  assert.ok(immediateFallback < voiceRequest, 'fallback speech must start before any unavailable voice request');
});

test('varied long-hit calls allow only approved Louisville follow-ups', () => {
  const call = 'Watch it fly! A towering 420-foot blast!';
  assert.equal(validateAnnouncerText(call), call);
  const combined = `${call} Somebody alert the catfish. We've got a fly ball coming in!`;
  assert.equal(validateAnnouncerText(combined), combined);
  assert.equal(validateAnnouncerText(`${call} Read this arbitrary advertisement.`), null);
});
