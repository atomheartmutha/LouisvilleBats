# 🦇 Batyard Slugger — Louisville Bats Ballpark Video Game

> **Challenge Sponsor:** Carter Davis, Louisville Bats ("Bring the ballpark to the browser").  
> **Inspiration:** 90s/2000s *Backyard Baseball* (Humongous Entertainment) nostalgia meets Kentucky educational standards.  
> **Technologies:** Google Gemini 1.5 Flash, Vultr Cloud Compute, MLB Stats API (`sportId=11`).

---

## 🌟 Overview & Sponsor Solution

Physical kids' activity books at Louisville Slugger Field have declined in usage, making seasonal print runs difficult to estimate. **Batyard Slugger** replaces static paper booklets with a multi-level digital ballpark game designed for in-stadium QR code scans and embedding on `batsbaseball.com`.

Every level teaches children and fans to love the sport of baseball through authentic baseball statistics and Kentucky State Standards.

---

## 🎮 The Three Playable Levels

### 🎨 Level 1: Pre-K Coloring Dugout (Early Childhood & ELC)
- **Interactive Digital Coloring Book:** Replaces paper coloring books with an interactive canvas featuring:
  - Buddy Bat swinging a Louisville Slugger bat
  - Louisville Slugger Field diamond
  - Louisville Bats cap & baseball
- **Crayon & Marker Palette:** Bats Red, Midnight Navy, Slugger Gold, Turf Green, and Sandlot Clay.
- **Save Art Button:** Kids can download their custom digital drawings directly to their phone or tablet.
- **ELC Question Station:**
  - Shape recognition (identifying home plate as a 5-sided pentagon).
  - Visual counting (counting Buddy Bat's baseballs: 1, 2, 3, 4).
  - Bat Biology & Science (mammalian flight, echolocation sound waves).

### ⚾ Level 2: 3rd–5th Grade Batyard Derby (KAS Math & Science)
- **Playable Sandlot Batting Derby:**
  - Fastball and off-speed pitches thrown from the mound toward home plate.
  - Timed contact with trajectory, exit velocity, and distance tracking.
- **Kentucky Academic Standards (KAS) Math & Science Engine:**
  - **Fractions as Division & Decimals:** Converting hits divided by at-bats into 3-digit batting averages ($3/10 \rightarrow .300$).
  - **Order of Operations & Total Bases:** Weighted arithmetic: $(1\text{B} \times 1) + (2\text{B} \times 2) + (3\text{B} \times 3) + (4\text{B} \times 4)$.
  - **Newtonian Forces & Motion (`KY.3-PS2`, `KY.5-PS2`):** Unbalanced collision forces between bat and ball, air resistance, and gravity creating projectile arc trajectories.
- **3x Super Slugger Power Bat:** Solving questions correctly supercharges the bat for tape-measure home runs splashing into the Ohio River!

### 📊 Level 3: Post-Secondary Sabermetrics & Front Office War Room
- **Front Office Analytics Engine:**
  - **Bill James Pythagorean Win Expectancy:** Non-linear modeling ($\text{Win\%} = \text{RS}^{1.83} / (\text{RS}^{1.83} + \text{RA}^{1.83})$) to project team record from run differential.
  - **Weighted On-Base Average (wOBA):** Linear-weight regression calculator for run values ($0.89\times 1\text{B} + 1.27\times 2\text{B} + 1.62\times 3\text{B} + 2.10\times\text{HR} + 0.69\times\text{BB}$).
  - **Fielding Independent Pitching (FIP):** Isolating true pitching talent from defense-dependent outcomes.
  - **24 Base-Out State Markov Chain Run Expectancy (RE24):** Interactive matrix calculating expected runs to end of inning based on outs and base runners.
  - **Statcast Aerodynamics:** Magnus effect, backspin lift, and launch angle optimization.

---

## 🧢 Louisville Bats MLB Stats API Integration

- Direct integration with the **MLB Stats API** (`https://statsapi.mlb.com/api/v1/schedule/games/?sportId=11`).
- Pulls live Triple-A schedule data and transforms real Louisville Bats player statlines (Noelvi Marte, Carlos Jorge, Dominic Fletcher, Jay Allen II) into 1–10 *Backyard Baseball* kid ratings (Batting, Running, Pitching, Fielding).
- Powered by **Google Gemini 1.5 Flash** to generate custom sandlot kid personas, funny playground quirks, and backyard superpowers.

---

## 🚀 Running Locally

```bash
cd ~/.gemini/users/user1/road-to-the-bats
npm start
```
Visit [http://localhost:3000](http://localhost:3000).

For ElevenLabs PA voice-overs, copy `.env.example` to `.env` and set
`ELEVENLABS_API_KEY`. Voice ID `GyIXYY876myKNtA1j8NI` and the low-latency
`eleven_flash_v2_5` model are configured by default. The API key stays on the
server; browsers automatically fall back to native speech when voice generation
is unavailable.

---

## ☁️ Live Cloud Deployment on Vultr

The game is hosted and running live on **Vultr Cloud Compute** at:
- **Game URL:** [http://155.138.222.107:3000](http://155.138.222.107:3000)
- **Health Endpoint:** [http://155.138.222.107:3000/api/health](http://155.138.222.107:3000/api/health)
