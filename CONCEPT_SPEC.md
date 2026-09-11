# ⚾ Concept Spec: Road to the Bats — Baseball Math Blaster

> **Inspiration:** 90s/2000s edutainment classics (*Math Blaster*, The Learning Company's *Zoombinis*, *Treasure Mountain*, *Super Solvers*).  
> **Challenge Sponsor:** Carter Davis, Louisville Bats ("Bring the ballpark to the browser").  
> **Mission:** Replace declining printed activity books with an arcade baseball video game where solving math challenges teaches baseball statistics across real-world education standards.

---

## 1. The 7-Tier Progression Hierarchy

The game follows a continuous career progression from first swinging a bat to managing an MLB front office analytics department:

```
[Pre-K]           1. T-Ball League         → Counting, shapes, basic number recognition (Ages 3–5)
[Lower Elem]      2. Rec League            → Addition, subtraction, early place value (Grades K–2 / Ages 5–8)
[Upper Elem]      3. Little League         → Multiplication/division, fractions, decimals, batting avg (Grades 3–5 / Ages 8–11)
[Middle School]   4. Travel Ball           → Ratios, rates, percentages, ERA, strikeout rates (Grades 6–8 / Ages 11–14)
[High School]     5. Varsity               → Algebra, geometry, OBP, SLG, OPS, linear models, kinematics (Grades 9–12 / Ages 14–18)
[College]         6. MLB / The Show        → Probability, calculus, linear regression, Pythagorean win %, wOBA, FIP (Ages 18–22)
[Post-Secondary]  7. Front Office          → Sabermetric theory, discrete Markov chains, run expectancy matrices (Collegiate / Grad)
```

---

## 2. Level-by-Level Curriculum & Baseball Stats Mapping

### Tier 1: T-Ball (Pre-K / Ages 3–5)
* **Education Stage:** Early Childhood / Pre-K Foundations
* **Math Focus:** Number recognition (1–10), counting physical items, identifying basic shapes (diamond, circle, home plate pentagon), greater than/less than with visual objects.
* **Baseball Concepts:** Counting strikes, counting balls, innings, identifying bases.
* **Sample Problems:**
  - *"Count the baseballs in Buddy Bat's bucket: ⚾ ⚾ ⚾ ⚾ (Answer: 4)"*
  - *"Which team has MORE runs? Bats: 5 | Opponents: 3"*
  - *"What shape is home plate? (Circle, Triangle, Pentagon)"*

---

### Tier 2: Rec League (Lower Elementary / Grades K–2 / Ages 5–8)
* **Kentucky Academic Standards Alignment:**
  - `KY.K.OA`: Understand addition as putting together and subtraction as taking apart.
  - `KY.1.OA` & `KY.1.NBT`: Operations within 20; place value concepts.
  - `KY.2.OA` & `KY.2.NBT`: Addition and subtraction within 100; word problems with lengths and time.
* **Baseball Concepts:** Runs scored per inning, run differentials (leads/deficits), tracking team outs, total hits in a series.
* **Sample Problems:**
  - *"The Louisville Bats scored 4 runs in the 1st inning and 3 runs in the 4th inning. How many runs did they score in total?"* ($4 + 3 = 7$)
  - *"There are 3 outs in an inning. The Bats defense has made 1 out. How many more outs do they need to retire the side?"* ($3 - 1 = 2$)
  - *"The Bats had 15 hits on Friday and 12 hits on Saturday. How many total hits?"* ($15 + 12 = 27$)

---

### Tier 3: Little League / Minors & Majors (Upper Elementary / Grades 3–5 / Ages 8–11)
* **Kentucky Academic Standards Alignment:**
  - `KY.3.OA` & `KY.3.MD`: Multiplication and division within 100; area/perimeter of rectangular fields.
  - `KY.4.OA` & `KY.4.NBT`: Multi-digit arithmetic and factor pairs.
  - `KY.4.NF` & `KY.5.NF`: Fractions as division, comparing fractions with unlike denominators, adding/subtracting fractions.
  - `KY.5.NBT`: Reading, writing, and rounding decimals to the thousandths place (e.g. $.250$, $.333$, $.750$).
* **Baseball Concepts:** Basic Batting Average (AVG), Total Bases (TB), Fielding Percentage, Inning Run Rates.
* **Sample Problems:**
  - **Batting Average to Thousandths:** *"A player gets 1 hit in 4 at-bats ($1 \div 4$). Write their batting average as a 3-digit decimal."* ($1/4 = .250$)
  - **Total Bases (TB):** $	ext{TB} = (1	ext{B} 	imes 1) + (2	ext{B} 	imes 2) + (3	ext{B} 	imes 3) + (4	ext{B} 	imes 4)$.  
    *"Buddy Bat hit 2 singles, 1 double, and 1 home run. What is his total bases score?"* ($(2 	imes 1) + (1 	imes 2) + (1 	imes 4) = 8	ext{ bases}$)
  - **Fielding Percentage as a Decimal:** *"A center fielder has 20 chances and makes 19 catches. What is their fielding percentage?"* ($19 \div 20 = .950$)
  - **Perimeter of Basepaths:** *"Each base path is 60 feet in Little League. What is the total perimeter around all 4 bases?"* ($4 	imes 60 = 240	ext{ feet}$)

---

### Tier 4: Travel Ball (Middle School / Grades 6–8 / Ages 11–14)
* **Kentucky Academic Standards Alignment:**
  - `KY.6.RP` & `KY.7.RP`: Ratio and proportional relationships, unit rates, percentages.
  - `KY.7.NS` & `KY.8.NS`: Rational numbers, multi-step problem solving with positive and negative numbers.
  - `KY.8.EE`: Linear equations and proportional relationships ($y = mx$).
* **Baseball Concepts:** Advanced Batting Average, Earned Run Average (ERA as a unit rate scaled to 9 innings), Strikeout-to-Walk Ratio ($K/	ext{BB}$), Stolen Base Success Rate.
* **Sample Problems:**
  - **Earned Run Average (ERA):** $	ext{ERA} = rac{	ext{Earned Runs} 	imes 9}{	ext{Innings Pitched}}$.  
    *"A Bats pitcher allows 6 earned runs over 18 innings. What is their ERA?"* ($rac{6 	imes 9}{18} = 3.00$)
  - **Strikeout-to-Walk Ratio ($K/	ext{BB}$):** *"A pitcher records 72 strikeouts and 18 walks. What is their strikeout-to-walk ratio in simplest form?"* ($72 : 18 = 4 : 1$)
  - **Stolen Base Success Percentage:** *"A runner attempts 30 stolen bases and is caught stealing 6 times. What is their success rate?"* ($rac{24}{30} = 80\%$)

---

### Tier 5: Varsity (High School / Grades 9–12 / Ages 14–18)
* **Kentucky Academic Standards Alignment:**
  - `KY.HS.A-CED` & `KY.HS.A-REI`: Creating equations, reasoning with inequalities, systems of equations.
  - `KY.HS.F-IF`: Interpreting functions, rates of change, graphing quadratic trajectory.
  - `KY.HS.S-ID` & `KY.HS.S-IC`: Summarizing bivariate data, correlation vs. causation, normal distributions.
* **Baseball Concepts:** On-Base Percentage (OBP), Slugging Percentage (SLG), On-Base Plus Slugging (OPS), Launch Angle & Exit Velocity (projectile motion / quadratic kinematics).
* **Sample Problems:**
  - **On-Base Percentage (OBP):**  
    $	ext{OBP} = rac{	ext{H} + 	ext{BB} + 	ext{HBP}}{	ext{AB} + 	ext{BB} + 	ext{HBP} + 	ext{SF}}$
    *"Given: 45 Hits, 15 Walks, 2 Hit-by-Pitch, 140 At-Bats, 3 Sacrifice Flies. Calculate OBP."* ($rac{62}{160} = .3875 ightarrow .388$)
  - **Slugging Percentage (SLG):**  
    $	ext{SLG} = rac{1	ext{B} + (2 	imes 2	ext{B}) + (3 	imes 3	ext{B}) + (4 	imes 	ext{HR})}{	ext{AB}}$
  - **Quadratic Trajectory & Exit Velocity:** *"A baseball hit with exit velocity $v_0 = 105	ext{ mph}$ ($154	ext{ ft/s}$) at launch angle $28^\circ$. Using $y(t) = y_0 + v_{0y}t - 16t^2$, will it clear the 10-foot outfield wall at 400 feet?"*

---

### Tier 6: MLB / The Show (College Level / Undergraduate Math)
* **Undergraduate Mathematics:** Differential & Integral Calculus, Multivariable Statistics, Linear Regression, Non-Linear Parameter Estimation.
* **Baseball Concepts:** Bill James' Pythagorean Expectation, wOBA (Weighted On-Base Average) linear weights, FIP (Fielding Independent Pitching), Park Factor adjustments.
* **Sample Problems:**
  - **Pythagorean Win Expectation (Non-linear exponent estimation):**  
    $	ext{Win \%} = rac{	ext{Runs Scored}^\gamma}{	ext{Runs Scored}^\gamma + 	ext{Runs Allowed}^\gamma} \quad (\gamma pprox 1.83)$
  - **wOBA (Empirical Linear Weights Derivation):**  
    $	ext{wOBA} = rac{0.69 \cdot 	ext{uBB} + 0.72 \cdot 	ext{HBP} + 0.89 \cdot 1	ext{B} + 1.27 \cdot 2	ext{B} + 1.62 \cdot 3	ext{B} + 2.10 \cdot 	ext{HR}}{	ext{AB} + 	ext{BB} - 	ext{IBB} + 	ext{SF} + 	ext{HBP}}$
  - **Fielding Independent Pitching (FIP):**  
    $	ext{FIP} = rac{(13 	imes 	ext{HR}) + (3 	imes (	ext{BB} + 	ext{HBP})) - (2 	imes 	ext{K})}{	ext{IP}} + C_{	ext{FIP}}$

---

### Tier 7: Front Office (Advanced Stats, Math & Sabermetric Theory)
* **Post-Secondary / Graduate Topics:** Stochastic Processes, Discrete Markov Chains, Matrix Algebra, Bayesian Inference, Machine Learning Expectation-Maximization.
* **Sabermetric Theory Concepts:** 24 Base-Out State Run Expectancy Matrix (RE24), Win Probability Added (WPA), WAR (Wins Above Replacement) structural decomposition, Leverage Index ($LI$).
* **Sample Problems:**
  - **Discrete Markov Transition Matrices for Inning States:**  
    Model the transition probability matrix $P$ across the 24 discrete states and compute expected runs to end of inning from any state $s$:
    $R(s) = \sum_{s'} P(s, s') [r(s, s') + R(s')]$
  - **Bayesian Player Projection (Marcel / PECOTA style):**  
    Update prior batting distribution $Beta(lpha, eta)$ with observed plate appearances using shrinkage estimation.
  - **Win Probability Added (WPA):** Evaluate the change in game win expectancy $\Delta WE = WE_{t+1} - WE_t$ for high-leverage relief appearances.

---

## 3. Gemini API Integration Architecture

* **Tier-Specific Dynamic Generation:** Frontend sends `{ tier: 1..7 }`. The backend builds system prompts mapped strictly to that educational level (from preschool counting objects to collegiate stochastic modeling).
* **Buddy Bat Socratic Tutor:** Adjusts tone and vocabulary automatically:
  - *Tier 1–2:* Friendly, enthusiastic, high-fives, emojis, visual counting cues.
  - *Tier 3–4:* Coach-style advice, practical real-game baseball arithmetic tips.
  - *Tier 5–7:* Analytical, data-driven front-office assistant reviewing statistical rigor and assumptions.

---

## 4. Vultr Cloud Deployment Architecture

* Low-latency delivery of the web application and API proxy on Vultr Cloud Compute.
* High-concurrency readiness for stadium QR code scans during game-day events at Louisville Slugger Field.
