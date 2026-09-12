import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTripleASchedule, transformToBackyardStats, FALLBACK_BATS_ROSTER } from './src/mlbApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const HOST = process.env.HOST || '0.0.0.0';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Generic Gemini API Helper
async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return { error: 'GEMINI_API_KEY not configured.', mock: true };
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
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
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

// Expanded Curriculum Questions (Kentucky Academic Standards + Louisville Bats History)
const CURRICULUM_QUESTIONS = {
  'pre-k': [
    {
      id: 'pk-1',
      q: "Count Buddy Bat's baseballs: ⚾ ⚾ ⚾ ⚾. How many are there?",
      options: ["3", "4", "5", "6"],
      ans: 1,
      explanation: "Great job! Count with Buddy: 1, 2, 3, 4 baseballs!",
      standard: "ELC / KY.K.CC - Counting & Cardinality"
    },
    {
      id: 'pk-2',
      q: "Home plate has 5 straight sides. What shape is home plate?",
      options: ["Circle", "Triangle", "Pentagon", "Square"],
      ans: 2,
      explanation: "A 5-sided shape is called a pentagon, just like home plate at Louisville Slugger Field!",
      standard: "ELC - Shape Identification"
    },
    {
      id: 'pk-3',
      q: "Science Fact: Bats like Buddy Bat are the only mammals that can fly! How do bats navigate in the dark?",
      options: ["Flashlights", "Echolocation (sound waves)", "Smell only", "Night vision goggles"],
      ans: 1,
      explanation: "Bats use echolocation! They make high-pitched sounds that bounce off objects like radar!",
      standard: "ELC / NGSS Science - Animal Traits & Senses"
    },
    {
      id: 'pk-4',
      q: "The Louisville Bats have 5 runs and the opposing team has 3 runs. Who has MORE runs?",
      options: ["Louisville Bats", "Opposing Team", "They are tied", "Zero"],
      ans: 0,
      explanation: "5 is greater than 3! The Bats are winning the game!",
      standard: "ELC - Number Comparisons"
    },
    {
      id: 'pk-5',
      q: "What color is the official cap of the Louisville Bats mascot, Buddy Bat?",
      options: ["Green", "Purple", "Bats Red & Navy Blue", "Orange"],
      ans: 2,
      explanation: "Buddy Bat wears the official Louisville Bats colors: Red, Navy Blue, and Gold!",
      standard: "ELC - Color & Community Recognition"
    },
    {
      id: 'pk-6',
      q: "How many bases must a player run around to score a run? (1st, 2nd, 3rd, and Home)",
      options: ["2", "3", "4", "5"],
      ans: 2,
      explanation: "There are 4 bases! First base, second base, third base, and home plate!",
      standard: "ELC - Counting & Sequencing"
    },
    {
      id: 'pk-7',
      q: "Buddy Bat has 2 baseballs in his left wing and 3 in his right wing. How many in all?",
      options: ["4", "5", "6", "7"],
      ans: 1,
      explanation: "2 + 3 = 5 baseballs in total! Fantastic counting!",
      standard: "KY.K.OA - Basic Addition Foundations"
    }
  ],
  'grades-3-5': [
    {
      id: 'elem-1',
      q: "A Louisville Bats hitter gets 3 hits in 10 at-bats (3/10). What is their batting average expressed as a three-place decimal?",
      options: [".030", ".300", ".333", ".003"],
      ans: 1,
      explanation: "3 ÷ 10 = 0.300. In baseball statistics, batting average is always rounded to thousandths (.001)!",
      standard: "KY.5.NBT & KY.4.NF - Decimals to Thousandths & Fractions as Division"
    },
    {
      id: 'elem-2',
      q: "Buddy Bat hit 2 singles, 1 double, and 1 home run. What are his Total Bases (TB)? [Formula: (1B×1) + (2B×2) + (3B×3) + (4B×4)]",
      options: ["6", "7", "8", "9"],
      ans: 2,
      explanation: "(2 × 1) + (1 × 2) + (1 × 4) = 2 + 2 + 4 = 8 Total Bases!",
      standard: "KY.4.OA - Multi-step Arithmetic & Order of Operations"
    },
    {
      id: 'elem-3',
      q: "Science (Forces & Motion): When a Louisville Slugger bat strikes an incoming pitch, what causes the ball to accelerate into the outfield?",
      options: [
        "Unbalanced contact force exerted by the swinging bat",
        "The spin of the Earth",
        "Air resistance alone",
        "Gravity pulling it forward"
      ],
      ans: 0,
      explanation: "KY.3-PS2: The swinging bat applies an unbalanced kinetic contact force to the ball, reversing its direction and propelling it into fair territory!",
      standard: "KY.3-PS2 & KY.5-PS2 - Forces, Motion & Energy Transfer"
    },
    {
      id: 'elem-4',
      q: "A center fielder at Louisville Slugger Field has 20 fielding chances and makes 19 successful outs (1 error). What is their fielding percentage?",
      options: [".950", ".850", ".900", ".990"],
      ans: 0,
      explanation: "19 ÷ 20 = 0.950 fielding percentage. That means they made the play 95% of the time!",
      standard: "KY.5.NBT - Fraction-to-Decimal Division"
    },
    {
      id: 'elem-5',
      q: "Science (Aerodynamics): Why does a fly ball follow a curved parabolic arc rather than flying in a straight line forever?",
      options: [
        "Earth's gravity pulls it downward while aerodynamic drag slows it",
        "The outfield grass acts like a magnet",
        "The clouds block the ball",
        "Sunlight pushes the ball down"
      ],
      ans: 0,
      explanation: "KY.5-PS2: Gravity constantly pulls the baseball toward the ground, and air drag opposes its forward velocity, creating an arc trajectory!",
      standard: "KY.5-PS2 - Gravitational Force & Projectile Motion"
    },
    {
      id: 'elem-6',
      q: "In Little League, the distance between each base is 60 feet. What is the total perimeter around all 4 bases?",
      options: ["180 feet", "240 feet", "300 feet", "360 feet"],
      ans: 1,
      explanation: "4 sides × 60 feet = 240 feet total perimeter around the base paths!",
      standard: "KY.3.MD & KY.4.MD - Perimeter & Measurement"
    },
    {
      id: 'elem-7',
      q: "Bats History: What famous river flows right behind the outfield wall of Louisville Slugger Field?",
      options: ["Mississippi River", "Ohio River", "Kentucky River", "Hudson River"],
      ans: 1,
      explanation: "The Ohio River flows directly past Louisville Slugger Field on East Main Street in downtown Louisville!",
      standard: "Kentucky History & Geography"
    },
    {
      id: 'elem-8',
      q: "Joey Votto played for the Louisville Bats before becoming an MVP. If he had 150 hits in 500 at-bats in Triple-A, what was his batting average?",
      options: [".250", ".300", ".350", ".275"],
      ans: 1,
      explanation: "150 ÷ 500 = 15 ÷ 50 = 0.300 batting average! A stellar .300 Triple-A mark!",
      standard: "KY.5.NBT - Decimal Division & Player Stats"
    }
  ],
  'post-secondary': [
    {
      id: 'ps-1',
      q: "Bill James' Pythagorean Expectation formula models a team's true talent win percentage. Using the empirical exponent γ = 1.83, what is the formula?",
      options: [
        "Win% = RS^1.83 / (RS^1.83 + RA^1.83)",
        "Win% = (RS - RA) / Games",
        "Win% = (RS + RA) / 1.83",
        "Win% = RS / (RA × 1.83)"
      ],
      ans: 0,
      explanation: "Pythagorean Win Expectation: Win% = RS^1.83 / (RS^1.83 + RA^1.83). It isolates true run-differential efficiency from luck!",
      standard: "Collegiate Sports Analytics - Non-linear Modeling & Sabermetrics"
    },
    {
      id: 'ps-2',
      q: "Why does Weighted On-Base Average (wOBA) assign higher linear weights to extra-base hits (e.g. 1.27 for 2B, 2.10 for HR) compared to OBP or SLG?",
      options: [
        "Linear weights reflect the empirical run expectancy change added by each specific event",
        "Because home runs look cooler on television",
        "It arbitrarily doubles the batting average",
        "Because stolen bases are ignored in sabermetrics"
      ],
      ans: 0,
      explanation: "wOBA weights are derived through empirical regression on run expectancy: each event is valued according to its actual historical run-creation value!",
      standard: "Post-Secondary Econometrics & Linear Regression"
    },
    {
      id: 'ps-3',
      q: "Fielding Independent Pitching (FIP) formula: [(13×HR) + 3×(BB+HBP) - (2×K)] / IP + C. What fundamental assumption underlies FIP?",
      options: [
        "Pitchers have minimal control over the outcome of balls hit into fair play (BABIP)",
        "Strikeouts are less valuable than groundouts",
        "Errors should be included in earned runs",
        "Home runs should be ignored in modern evaluation"
      ],
      ans: 0,
      explanation: "DIPS theory (Voros McCracken) demonstrated pitchers have very little control over fair balls falling for hits; FIP isolates true pitching talent (HR, BB, K)!",
      standard: "Advanced Sabermetric Theory & Stochastic Variance Decomposition"
    },
    {
      id: 'ps-4',
      q: "Statcast Aerodynamics: When a pitcher throws a four-seam fastball with 2400 RPM backspin, what physical phenomenon creates 'induced vertical break'?",
      options: [
        "The Magnus Effect (pressure differential from rotational airflow)",
        "Centrifugal acceleration only",
        "Coriolis acceleration from Earth rotation",
        "Thermal convection currents"
      ],
      ans: 0,
      explanation: "The Magnus Effect: Backspin creates high velocity and low pressure on top of the ball, generating aerodynamic lift that resists gravity!",
      standard: "Collegiate Fluid Dynamics & Sports Physics"
    },
    {
      id: 'ps-5',
      q: "In discrete Markov chain baseball modeling, how many fundamental base-out states exist in a half-inning before the 3rd out absorbing state?",
      options: ["18 states", "24 states", "27 states", "32 states"],
      ans: 1,
      explanation: "3 out states (0, 1, 2) × 8 base runner configurations (empty, 1st, 2nd, 3rd, 1-2, 1-3, 2-3, loaded) = exactly 24 base-out states!",
      standard: "Stochastic Processes & Discrete Markov Chains"
    }
  ]
};

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

  // 1. Health check endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ready',
      gameTitle: 'Batyard Slugger',
      theme: 'Backyard Baseball + Louisville Bats Ballpark',
      levels: ['Pre-K (Coloring Book & ELC)', 'Grades 3-5 (Little League Derby & KAS Math/Science)', 'Post-Secondary (Front Office Sabermetrics)'],
      geminiConfigured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      mlbStatsApiUrl: 'https://statsapi.mlb.com/api/v1/schedule/games/?sportId=11',
      vultrReady: true,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. MLB Stats API: Triple-A Schedule & Bats Games
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

  // 3. Backyard Baseball Character Generator: Real Bats Stats -> 1-10 Kid Attributes
  if (pathname === '/api/bats/characters' && req.method === 'GET') {
    try {
      const characters = FALLBACK_BATS_ROSTER.map(transformToBackyardStats);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        team: 'Louisville Bats',
        league: 'Triple-A (sportId=11)',
        style: 'Batyard Slugger Roster',
        characters
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Curriculum-Aligned Quiz Generator (Non-Repeating + Gemini Powered)
  if (pathname === '/api/quiz/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { level = 'grades-3-5', excludeId = '' } = JSON.parse(body || '{}');
        const validLevel = CURRICULUM_QUESTIONS[level] ? level : 'grades-3-5';
        const pool = CURRICULUM_QUESTIONS[validLevel];

        // Filter out recently seen ID to prevent repeating question bug
        const eligible = pool.filter(item => item.id !== excludeId);
        const selectedFallback = eligible.length > 0
          ? eligible[Math.floor(Math.random() * eligible.length)]
          : pool[Math.floor(Math.random() * pool.length)];

        // If Gemini is configured, occasionally generate a fresh question
        if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here' && Math.random() > 0.4) {
          const systemPrompt = `You are the lead educational question designer for "Batyard Slugger", a Backyard Baseball-styled video game for the Louisville Bats. 
Level: "${validLevel}". 
Generate ONE multiple choice question teaching baseball statistics and love for baseball through Kentucky State Standards (Math, Science, or Louisville Bats History).
Return ONLY valid JSON matching this exact format:
{
  "id": "gemini-${Date.now()}",
  "q": "question text",
  "options": ["A", "B", "C", "D"],
  "ans": 0,
  "explanation": "why it is correct",
  "standard": "specific standard (e.g. KAS KY.4.NF / KY.3-PS2 / Sabermetrics wOBA)"
}`;
          const userPrompt = `Generate a fresh question for ${validLevel} themed around Louisville Bats, Louisville Slugger Field, or baseball statistics.`;
          const geminiRes = await callGemini(userPrompt, systemPrompt);
          if (geminiRes.text) {
            try {
              const clean = geminiRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(clean);
              if (parsed.q && Array.isArray(parsed.options) && parsed.options.length === 4) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(parsed));
                return;
              }
            } catch (_) {}
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(selectedFallback));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Gemini API: Generate Backyard Baseball Kid Persona
  if (pathname === '/api/gemini/backyard-persona' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { playerName, position, stats } = JSON.parse(body || '{}');
        const systemPrompt = `You are the lead game designer and announcer for "Batyard Slugger", a 90s-style Backyard Baseball video game for the Louisville Bats. Turn real professional players into hilarious kid sandlot legends.`;
        
        const userPrompt = `Create a Backyard Baseball kid persona card for Louisville Bats player "${playerName || 'Slugger'}" (${position || 'OF'}). Real stats: Batting Avg: ${stats?.avg || '.280'}, HRs: ${stats?.hr || '12'}, Stolen Bases: ${stats?.sb || '15'}.
Include:
1. Kid Nickname (e.g., "The River City Rocket")
2. Sandlot Personality & Funny Playground Quirk
3. Favorite Dugout Snack / Juice Box
4. Backyard Superpower (e.g., Aluminum Power Bat, Turbo Cleats)`;

        const result = await callGemini(userPrompt, systemPrompt);
        if (result.mock || result.error) {
          result.text = `Kid Persona: "${playerName || 'Rookie'} - The Sandlot Slugger"\n• Quirk: Calls home runs with an ice cream sandwich in hand!\n• Dugout Snack: Cherry Blast Juice Box & Cracker Jacks\n• Backyard Superpower: "Aluminum Rocket Bat" - launches line drives splashing into the Ohio River!`;
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
  console.log(`⚾ Batyard Slugger Server Ready!`);
  console.log(`⚾ Running at: http://${HOST}:${PORT}`);
  console.log(`⚾ Levels: Pre-K (Coloring), Grades 3-5 (Derby), Post-Secondary (Sabermetrics)`);
});
