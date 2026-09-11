import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTripleASchedule, transformToBackyardStats, FALLBACK_BATS_ROSTER } from './src/mlbApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Generic Gemini API Helper
async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return {
      error: 'GEMINI_API_KEY not configured. Set GEMINI_API_KEY in .env to activate live API responses.',
      mock: true
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { error: `Gemini API returned status ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return { text: reply || '' };
  } catch (err) {
    return { error: err.message };
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ready',
      project: 'Louisville Bats Challenge - Backyard Baseball Edition',
      geminiConfigured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      mlbStatsApiUrl: 'https://statsapi.mlb.com/api/v1/schedule/games/?sportId=11',
      vultrReady: true,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // MLB Stats API: Triple-A Schedule & Bats Games
  if (pathname === '/api/bats/schedule' && req.method === 'GET') {
    try {
      const schedule = await getTripleASchedule();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(schedule || { message: 'Schedule unavailable' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Backyard Baseball Character Generator: Real Bats Stats -> 1-10 Kid Attributes
  if (pathname === '/api/bats/characters' && req.method === 'GET') {
    try {
      const characters = FALLBACK_BATS_ROSTER.map(transformToBackyardStats);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        team: 'Louisville Bats',
        league: 'Triple-A (sportId=11)',
        style: 'Backyard Baseball Kid Roster',
        characters
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Gemini API: Generate Backyard Baseball Kid Persona
  if (pathname === '/api/gemini/backyard-persona' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { playerName, position, stats } = JSON.parse(body || '{}');
        const systemPrompt = `You are the lead game designer and announcer for a 90s-style "Backyard Baseball" video game (in the spirit of Humongous Entertainment, Pablo Sanchez, and Pete Wheeler). You turn real-life professional Louisville Bats baseball players into hilarious, lovable kid sandlot legends.`;
        
        const userPrompt = `Create a Backyard Baseball kid persona card for Louisville Bats player "${playerName || 'Slugger'}" (${position || 'OF'}). Real stats: Batting Avg: ${stats?.avg || '.280'}, HRs: ${stats?.hr || '12'}, Stolen Bases: ${stats?.sb || '15'}.
Include:
1. Kid Nickname (e.g., "The Louisville Lightning")
2. Sandlot Personality & Funny Playground Quirk
3. Favorite Dugout Snack / Juice Box
4. Backyard Superpower (e.g., Aluminum Power Bat, Turbo Cleats)`;

        const result = await callGemini(userPrompt, systemPrompt);
        if (result.mock || result.error) {
          result.text = `Kid Persona: "${playerName || 'Rookie'} - The Slugger Kid"\n• Quirk: Always wears their lucky backward cap and calls every home run before the pitch!\n• Dugout Snack: Cherry Blast Juice Box & Cracker Jacks\n• Backyard Superpower: "Aluminum Rocket Bat" - boosts exit velocity across the backyard fence!`;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Generic Gemini Generate endpoint
  if (pathname === '/api/gemini/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { prompt, systemInstruction } = JSON.parse(body || '{}');
        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
          return;
        }

        const result = await callGemini(prompt, systemInstruction);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve static files from public/
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, 'public', normalized);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`⚾ Environment ready: Louisville Bats Backyard Baseball Edition!`);
  console.log(`⚾ Local server: http://${HOST}:${PORT}`);
  console.log(`⚾ MLB Stats API (sportId=11): Integrated via /api/bats/*`);
  console.log(`⚾ Gemini API: ${GEMINI_API_KEY ? 'Configured' : 'Pending API Key in .env'}`);
});
