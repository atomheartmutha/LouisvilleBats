# 🤖 Google Gemini API Setup & Features Guide

This guide explains how to activate and configure the **Google Gemini API** for **Road to the Bats** to qualify for the **"Best Use of Gemini API"** track at MLH HackKentucky.

---

## 1. Getting Your Gemini API Key
You have two fast ways to get a key:

### Option A: Google AI Studio (Instant & Free)
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API Key** > **Create API key in new project**.
4. Copy your key.

### Option B: MLH Student Plan & Credits
1. Visit the [MLH Gemini Partner Page](https://www.mlh.com/partners/gemini).
2. Claim the **Google Student Plan** (free for 1 year, includes Gemini Pro access, 5 TB storage, and credits).
3. Activate the **$10/month free credits** via the MLH benefits link.

---

## 2. Configure Your Local Project
Open `.env` in the project root:

```bash
nano .env
```

Paste your API key:
```env
GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
PORT=3000
NODE_ENV=development
```

Save and restart your local dev server:
```bash
npm run dev
```

---

## 3. How Gemini API Powers "Road to the Bats"

The project integrates Gemini 1.5 Flash across four core game modules:

1. **Buddy Bat Mascot Coach (`/api/gemini/coach`)**:
   - Generates enthusiastic, kid-friendly batting advice and baseball tips.
   - Tailored to the kid's chosen league level (T-Ball, Minors, or Triple-A) and game situation.

2. **Dynamic Math Power-Up Generator (`/api/gemini/math-powerup`)**:
   - Creates age-appropriate baseball arithmetic problems (counting baseballs, calculating batting averages, percentages, run differentials).
   - Solving the problem activates a 3x power-up hit that launches the baseball over the outfield wall into the Ohio River.

3. **Play-by-Play Stadium Announcer (`/api/gemini/play-by-play`)**:
   - Generates authentic, electrifying stadium announcer calls for hits, home runs, and strikeouts at Louisville Slugger Field.

4. **Collectible Rookie Card Scouting Report (`/api/gemini/scouting-report`)**:
   - Writes a customized professional scouting report for the kid's custom player and jersey number.

---

## 4. Graceful Fallback Mode
If an API key is not yet set or the network is offline, the game automatically uses high-quality curriculum fallbacks. This ensures judges and players always experience a seamless, uninterrupted gameplay demo!
