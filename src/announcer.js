const DEFAULT_VOICE_ID = 'GyIXYY876myKNtA1j8NI';
const DEFAULT_MODEL_ID = 'eleven_flash_v2_5';
const MAX_REQUEST_BYTES = 1024;
const MAX_CACHE_ENTRIES = 64;

const exactLines = new Set([
  'Batter up! Welcome to Louisville Slugger Field!',
  'CHARGE!',
  'Correct! Your power bat is ready. Batter up!',
  '.300 batting average locked in!',
  'Strike!',
  'Three outs, side retired!',
  'Art saved! Twenty-five points awarded!',
  'Five baseballs counted! Awesome job!',
  'Correct! Home plate is a five-sided pentagon!'
]);

const dynamicLines = [
  /^GOODBYE BASEBALL! Hammered [1-9][0-9]{1,2} feet into the Ohio River!$/,
  /^Hit into the gap for a (Single|Double)!$/,
  /^Now batting for the Louisville Bats: [\p{L} .,'’-]{1,80}!$/u,
  /^[1-5]!$/,
  /^Simulated record: (?:[0-9]|[1-9][0-9]|1[0-5][0-9]|16[0-2]) wins and (?:[0-9]|[1-9][0-9]|1[0-5][0-9]|16[0-2]) losses\.$/
];

export function validateAnnouncerText(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || text.length > 180) return null;
  return exactLines.has(text) || dynamicLines.some(pattern => pattern.test(text)) ? text : null;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_REQUEST_BYTES) throw new Error('REQUEST_TOO_LARGE');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function createAnnouncerVoiceHandler({
  apiKey = process.env.ELEVENLABS_API_KEY || '',
  voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID,
  modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID,
  fetchImpl = globalThis.fetch,
  cache = new Map()
} = {}) {
  return async function serveAnnouncerVoice(req, res) {
    try {
      const { text: suppliedText } = await readJson(req);
      const text = validateAnnouncerText(suppliedText);
      if (!text) {
        sendJson(res, 400, { error: 'Unsupported announcer line.' });
        return;
      }

      if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        sendJson(res, 503, { error: 'ElevenLabs is not configured.', fallback: true });
        return;
      }

      const cached = cache.get(text);
      if (cached) {
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'private, max-age=86400',
          'X-Voice-Cache': 'HIT'
        });
        res.end(cached);
        return;
      }

      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`;
      const upstream = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.48,
            similarity_boost: 0.8,
            style: 0.18,
            use_speaker_boost: true
          }
        })
      });

      if (!upstream.ok) {
        sendJson(res, 502, { error: 'Voice generation unavailable.', fallback: true });
        return;
      }

      const audio = Buffer.from(await upstream.arrayBuffer());
      if (!audio.length || audio.length > 2_000_000) {
        sendJson(res, 502, { error: 'Invalid voice response.', fallback: true });
        return;
      }

      if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
      cache.set(text, audio);
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=86400',
        'X-Voice-Cache': 'MISS'
      });
      res.end(audio);
    } catch (error) {
      const status = error.message === 'REQUEST_TOO_LARGE' ? 413 : 400;
      sendJson(res, status, { error: status === 413 ? 'Request too large.' : 'Invalid request.' });
    }
  };
}

export { DEFAULT_VOICE_ID, DEFAULT_MODEL_ID };
