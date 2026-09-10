import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser to avoid requiring external dependencies
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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Helper to call Gemini REST API directly
async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return null; // Signals to use fallback
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
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
      const errorText = await res.text();
      console.warn(`Gemini API returned status ${res.status}:`, errorText);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err) {
    console.warn('Error calling Gemini API:', err.message);
    return null;
  }
}

// MIME types map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Endpoints ---

  // Health check endpoint (for Vultr monitor & local diagnostics)
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      app: 'Road to the Bats — Ballpark Browser Game',
      team: 'Louisville Bats (Triple-A Affiliate of Cincinnati Reds)',
      stadium: 'Louisville Slugger Field',
      gemini_configured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      vultr_ready: true,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Helper to read JSON request body
  const readJsonBody = async () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  // 1. Buddy Bat Mascot Coach dialogue
  if (pathname === '/api/gemini/coach' && req.method === 'POST') {
    try {
      const { playerLevel = 'T-Ball', situation = 'up to bat', score = 0 } = await readJsonBody();
      
      const systemPrompt = `You are "Buddy Bat", the beloved and energetic bat mascot of the Louisville Bats baseball team! You are speaking directly to a young kid (ages 6-12) playing "Road to the Bats" on their phone or web browser at Louisville Slugger Field. Keep your reply short (1 to 2 enthusiastic, kid-friendly sentences), full of baseball puns, bat enthusiasm, and positive coaching!`;
      
      const userPrompt = `The player is currently at the "${playerLevel}" level with a score of ${score}. The situation is: "${situation}". Give them a quick boost of encouragement or coaching tip!`;
      
      let speech = await callGemini(userPrompt, systemPrompt);

      if (!speech) {
        // Fallback responses
        const fallbacks = [
          "Flap your wings and keep your eye on the ball! You've got Louisville Slugger power in that swing!",
          "Great hustle out there! Remember to stay balanced at the plate and drive it towards the Ohio River!",
          "Buddy Bat believes in you! Take a deep breath, watch the seams, and knock it right out of the park!",
          "Looking sharp in that Bats uniform! Let's power up with some math and send this pitch soaring!"
        ];
        speech = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ mascot: 'Buddy Bat', message: speech }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 2. Math Challenge Generator to Power Up Batting
  if (pathname === '/api/gemini/math-powerup' && req.method === 'POST') {
    try {
      const { ageGroup = '6-8', level = 'T-Ball' } = await readJsonBody();

      const systemPrompt = `Generate a single fun, kid-friendly baseball math question for age group ${ageGroup} (${level} level) to power up a baseball swing in "Road to the Bats". Return ONLY valid JSON in this exact structure:
{"question": "...", "options": ["...", "...", "...", "..."], "answerIndex": 0, "funFact": "..."}`;

      const userPrompt = `Generate 1 quick math question themed around Louisville Bats, baseball batting averages, runs, bases, or hotdogs at the stadium.`;

      let challenge = null;
      const raw = await callGemini(userPrompt, systemPrompt);
      if (raw) {
        try {
          const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          challenge = JSON.parse(clean);
        } catch (_) {}
      }

      if (!challenge) {
        // High quality curriculum fallback questions
        if (ageGroup === '5 or younger' || ageGroup === '6–8' || ageGroup === '6-8') {
          challenge = {
            question: "Buddy Bat caught 3 baseballs in the 1st inning and 4 in the 2nd. How many did he catch in total?",
            options: ["6", "7", "8", "9"],
            answerIndex: 1,
            funFact: "Buddy Bat has big wings to catch soaring fly balls!"
          };
        } else if (ageGroup === '9–11' || ageGroup === '9-11') {
          challenge = {
            question: "A Bats slugger has 12 hits in 40 at-bats. What is their batting average?",
            options: [".250", ".300", ".333", ".400"],
            answerIndex: 1,
            funFact: "A .300 batting average means hitting safely 3 times out of every 10 at-bats!"
          };
        } else {
          challenge = {
            question: "If a Louisville runner takes a 12-foot lead off first base (90 ft total), what percentage of the distance to second base have they covered?",
            options: ["10%", "13.3%", "15%", "20%"],
            answerIndex: 1,
            funFact: "Base paths in professional baseball are exactly 90 feet apart!"
          };
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenge));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. Play-by-Play Stadium Announcer
  if (pathname === '/api/gemini/play-by-play' && req.method === 'POST') {
    try {
      const { hitType = 'Home Run', distance = 420, playerName = 'Slugger' } = await readJsonBody();
      const systemPrompt = `You are the booming, exciting ballpark PA announcer at Louisville Slugger Field for the Louisville Bats! Give a 1-sentence electrifying call of the play!`;
      const userPrompt = `Player ${playerName} just hit a ${hitType} measuring ${distance} feet into the stands! Call the play!`;

      let call = await callGemini(userPrompt, systemPrompt);
      if (!call) {
        if (hitType === 'Home Run' || hitType === 'Grand Slam') {
          call = `GOODBYE BASEBALL! ${playerName} launches a missile ${distance} feet way out past the outfield wall and splashing into the Ohio River!`;
        } else if (hitType === 'Double' || hitType === 'Triple') {
          call = `Ripped down the line! ${playerName} rounds first and slides into the base with a clutch hit!`;
        } else {
          call = `Solid contact right back up the middle by ${playerName}! That gets the Bats dugout roaring!`;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ announcer: call }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Custom Scouting Card Generator
  if (pathname === '/api/gemini/scouting-report' && req.method === 'POST') {
    try {
      const { playerName = 'Alex', number = '24', jerseyColor = 'Red', highScore = 1500 } = await readJsonBody();
      const systemPrompt = `You are the Chief Scouting Director for the Louisville Bats. Write an exciting, 2-sentence scouting report for a kid's rookie baseball card.`;
      const userPrompt = `Player: "${playerName}", Jersey #${number}, Favorite color: ${jerseyColor}, Ballpark Game Score: ${highScore}. Write their rookie card scouting report!`;

      let report = await callGemini(userPrompt, systemPrompt);
      if (!report) {
        report = `SCOUNTING REPORT: Number ${number} ${playerName} possesses lightning bat speed and an unmatched eye at the plate! With scores topping ${highScore}, this rookie is on a fast track straight to Louisville Slugger Field!`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ report }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --- Static Files Serving ---
  let safePath = pathname === '/' ? '/index.html' : pathname;
  // Security check: prevent directory traversal
  const normalized = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, 'public', normalized);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // 404 handler
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => {
  console.log(`⚾ =================================================`);
  console.log(`⚾ Louisville Bats: Road to the Bats Web Game`);
  console.log(`⚾ Local server running at: http://${HOST}:${PORT}`);
  console.log(`⚾ Gemini AI: ${GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'ENABLED (API key configured)' : 'FALLBACK MODE (Set GEMINI_API_KEY in .env to activate live AI)'}`);
  console.log(`⚾ Vultr Deployment: Ready (Dockerfile & scripts configured)`);
  console.log(`⚾ =================================================`);
});
