import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTripleASchedule } from './src/mlbApi.js';
import { getBatsCharacters } from './src/mlbApi.js';
import { getAdaptiveQuestion } from './src/questions.js';

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

// JCPS Computer-Adaptive Testing Question Bank
// Difficulty scales dynamically (Tier 1: Beginner, Tier 2: Basic, Tier 3: Proficient, Tier 4: Advanced, Tier 5: Mastery/Sabermetrics)
const ADAPTIVE_BANKS = {
  // Tier 1: Introductory / Scaffolding (Counting, Cardinality, Shape Match)
  1: [
    {
      id: 'cat-1-1',
      difficulty: 1,
      tierTitle: 'Tier 1: Foundations',
      q: "Count Buddy Bat's baseballs: ⚾ ⚾ ⚾ ⚾. How many total baseballs?",
      options: ["3", "4", "5", "6"],
      ans: 1,
      explanation: "Count with Buddy: 1, 2, 3, 4 baseballs!",
      standard: "JCPS ELC / KY.K.CC - Counting Cardinality"
    },
    {
      id: 'cat-1-2',
      difficulty: 1,
      tierTitle: 'Tier 1: Foundations',
      q: "Home plate at Louisville Slugger Field has 5 straight sides. What shape is it?",
      options: ["Circle", "Triangle", "Pentagon", "Square"],
      ans: 2,
      explanation: "A polygon with 5 sides is a pentagon, just like home plate!",
      standard: "JCPS ELC - Shape Identification"
    },
    {
      id: 'cat-1-3',
      difficulty: 1,
      tierTitle: 'Tier 1: Foundations',
      q: "The Louisville Bats have 4 runs and the opponents have 2 runs. How many MORE runs do the Bats have?",
      options: ["1 run", "2 runs", "4 runs", "6 runs"],
      ans: 1,
      explanation: "4 - 2 = 2 runs! The Bats hold a 2-run lead!",
      standard: "KY.1.OA - Basic Subtraction"
    }
  ],

  // Tier 2: Developing (Basic Arithmetic, Place Value, Simple Baseball Concepts)
  2: [
    {
      id: 'cat-2-1',
      difficulty: 2,
      tierTitle: 'Tier 2: Developing',
      q: "Buddy Bat caught 5 baseballs in the 1st inning and 6 in the 3rd inning. How many total catches?",
      options: ["10", "11", "12", "13"],
      ans: 1,
      explanation: "5 + 6 = 11 total catches for Buddy Bat!",
      standard: "KY.2.OA - Operations within 20"
    },
    {
      id: 'cat-2-2',
      difficulty: 2,
      tierTitle: 'Tier 2: Developing',
      q: "Science (Biology): How do bats like Buddy Bat navigate and locate flying baseballs in the dark?",
      options: ["Flashlights", "Echolocation (high-frequency sound waves)", "Smell only", "Thermal vision"],
      ans: 1,
      explanation: "Bats emit echolocation clicks that bounce off objects like acoustic radar!",
      standard: "KY Science Standards - Sensory Animal Structures"
    },
    {
      id: 'cat-2-3',
      difficulty: 2,
      tierTitle: 'Tier 2: Developing',
      q: "Each base path is 60 feet. If a runner hits a double (running to 1st then 2nd), how many total feet did they run?",
      options: ["60 feet", "100 feet", "120 feet", "180 feet"],
      ans: 2,
      explanation: "60 + 60 = 120 feet to reach 2nd base!",
      standard: "KY.3.MD - Linear Measurement & Addition"
    }
  ],

  // Tier 3: Proficient (Fractions, Batting Average Decimals, Contact Forces)
  3: [
    {
      id: 'cat-3-1',
      difficulty: 3,
      tierTitle: 'Tier 3: Proficient',
      q: "A Louisville Bats player has 3 hits in 10 at-bats (3/10). Express this as a 3-place batting average decimal:",
      options: [".030", ".300", ".333", ".003"],
      ans: 1,
      explanation: "3 ÷ 10 = 0.300. Baseball batting averages are always expressed to thousandths!",
      standard: "KY.5.NBT & KY.4.NF - Fractions as Division & Decimals"
    },
    {
      id: 'cat-3-2',
      difficulty: 3,
      tierTitle: 'Tier 3: Proficient',
      q: "Calculate Total Bases (TB) for a player with 2 singles, 1 double, and 1 home run. [(1B×1) + (2B×2) + (3B×3) + (4B×4)]",
      options: ["6", "7", "8", "9"],
      ans: 2,
      explanation: "(2 × 1) + (1 × 2) + (1 × 4) = 2 + 2 + 4 = 8 Total Bases!",
      standard: "KY.4.OA - Order of Operations & Weighted Sums"
    },
    {
      id: 'cat-3-3',
      difficulty: 3,
      tierTitle: 'Tier 3: Proficient',
      q: "Science (Kinetic Physics): When a wood bat strikes an 85 mph pitch, what causes the ball to reverse direction and fly into fair territory?",
      options: [
        "Unbalanced contact force from the swinging bat transferring kinetic energy",
        "The Earth's Coriolis force",
        "Air resistance alone",
        "Gravity pulling the ball forward"
      ],
      ans: 0,
      explanation: "KY.3-PS2: The swinging bat applies an unbalanced contact force, rapidly decelerating the pitch and accelerating it outward!",
      standard: "KY.3-PS2 - Forces and Motion"
    },
    {
      id: 'cat-3-4',
      difficulty: 3,
      tierTitle: 'Tier 3: Proficient',
      q: "A Louisville Bats outfielder makes 19 successful catches out of 20 total fielding chances. What is their fielding percentage?",
      options: [".950", ".850", ".900", ".975"],
      ans: 0,
      explanation: "19 ÷ 20 = 0.950 fielding percentage (95% success rate)!",
      standard: "KY.5.NBT - Decimal Division"
    }
  ],

  // Tier 4: Advanced (Ratios, ERA, Trajectory Aerodynamics, High School Algebra)
  4: [
    {
      id: 'cat-4-1',
      difficulty: 4,
      tierTitle: 'Tier 4: Advanced',
      q: "Earned Run Average (ERA) is defined as (Earned Runs × 9) / Innings Pitched. If a Bats pitcher allows 6 earned runs over 18 innings, what is their ERA?",
      options: ["2.50", "3.00", "3.50", "4.00"],
      ans: 1,
      explanation: "(6 × 9) / 18 = 54 / 18 = 3.00 ERA!",
      standard: "KY.6.RP & KY.7.RP - Rates and Proportional Reasoning"
    },
    {
      id: 'cat-4-2',
      difficulty: 4,
      tierTitle: 'Tier 4: Advanced',
      q: "On-Base Plus Slugging (OPS) sums OBP (.365) and SLG (.515). Calculate this hitter's OPS:",
      options: [".850", ".875", ".880", ".900"],
      ans: 2,
      explanation: "0.365 + 0.515 = 0.880 OPS (an All-Star level production mark)!",
      standard: "KY.HS.N-RN - Precision & Statistical Synthesis"
    },
    {
      id: 'cat-4-3',
      difficulty: 4,
      tierTitle: 'Tier 4: Advanced',
      q: "Statcast Aerodynamics: What physical principle explains why backspin on a four-seam fastball creates aerodynamic lift resisting gravity?",
      options: [
        "The Magnus Effect (pressure differential across rotating boundary layer)",
        "Gravitational redshift",
        "Bernoulli's buoyant floatation",
        "Thermal expansion of leather"
      ],
      ans: 0,
      explanation: "The Magnus Effect: Backspin creates higher velocity airflow underneath and lower pressure on top, generating upward lift!",
      standard: "KY Science Standards - Aerodynamics & Fluid Forces"
    }
  ],

  // Tier 5: Mastery / Post-Secondary (Sabermetrics, Pythagorean Modeling, wOBA, Markov Chains)
  5: [
    {
      id: 'cat-5-1',
      difficulty: 5,
      tierTitle: 'Tier 5: Sabermetrics Mastery',
      q: "Bill James' Pythagorean Expectation formula models true win percentage using exponent γ = 1.83. What is the expression?",
      options: [
        "Win% = RS^1.83 / (RS^1.83 + RA^1.83)",
        "Win% = (RS - RA) / Total Games",
        "Win% = RS / (RA × 1.83)",
        "Win% = (RS^2 + RA^2) / 1.83"
      ],
      ans: 0,
      explanation: "Win% = RS^1.83 / (RS^1.83 + RA^1.83). It estimates true win capacity from fundamental run differentials!",
      standard: "Collegiate Analytics - Non-linear Parameter Estimation"
    },
    {
      id: 'cat-5-2',
      difficulty: 5,
      tierTitle: 'Tier 5: Sabermetrics Mastery',
      q: "In discrete Markov chain baseball modeling, how many discrete base-out states exist in a half-inning before the 3rd out absorbing state?",
      options: ["18 states", "24 states", "27 states", "32 states"],
      ans: 1,
      explanation: "3 out states (0, 1, 2) × 8 base configurations (empty, 1st, 2nd, 3rd, 1-2, 1-3, 2-3, loaded) = exactly 24 states!",
      standard: "Post-Secondary Probability - Stochastic Processes & Markov Chains"
    },
    {
      id: 'cat-5-3',
      difficulty: 5,
      tierTitle: 'Tier 5: Sabermetrics Mastery',
      q: "Why does Weighted On-Base Average (wOBA) assign empirical linear weights (e.g. 0.89 for 1B, 1.27 for 2B, 2.10 for HR) rather than traditional slugging weights?",
      options: [
        "Linear weights reflect the empirical run expectancy change generated by each specific event",
        "It arbitrarily inflates home runs",
        "To eliminate walks from offensive valuation",
        "Because extra bases are measured in square feet"
      ],
      ans: 0,
      explanation: "Linear weights are derived via regression against run expectancy matrices to measure true historical run contribution!",
      standard: "Econometric Modeling & Linear Weights Regression"
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
      gameTitle: 'Batyard Slugger — Arcade Edition',
      adaptiveEngine: 'JCPS-Style Computer Adaptive Testing (Tiers 1-5)',
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
      const { characters, source, fetchedAt } = await getBatsCharacters();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        team: 'Louisville Bats',
        league: 'Triple-A (sportId=11)',
        style: 'Batyard Slugger Roster',
        characters, source, fetchedAt
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. JCPS-Style Computer-Adaptive Testing Question Generator
  // Adapts difficulty up (1->5) on correct streaks, scales down on incorrect answers
  if (pathname === '/api/quiz/adaptive' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const selected = await getAdaptiveQuestion(JSON.parse(body || '{}'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(selected));
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
  console.log(`⚾ Batyard Slugger: Arcade & Adaptive Edition`);
  console.log(`⚾ Running at: http://${HOST}:${PORT}`);
  console.log(`⚾ JCPS-Style Adaptive Engine Active (Tiers 1-5)`);
});
