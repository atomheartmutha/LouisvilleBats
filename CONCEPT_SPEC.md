# ⚾ Concept Spec: Road to the Bats — Baseball Math Blaster

> **Inspiration:** 90s/2000s edutainment classics (*Math Blaster*, The Learning Company's *Zoombinis*, *Treasure Mountain*, *Super Solvers*).  
> **Challenge Sponsor:** Carter Davis, Louisville Bats ("Bring the ballpark to the browser").  
> **Mission:** Replace declining printed activity books with an arcade baseball video game where solving math challenges teaches baseball statistics across real-world education standards.

---

## 1. The 6-Tier Progression Hierarchy

The game follows a continuous career progression from first swinging a bat to managing an MLB front office analytics department:

```
[Pre-K]           1. T-Ball League         → Counting, shapes, basic number recognition
[Lower Elem]      2. Rec League            → Addition, subtraction, early place value (KAS K–2)
[Middle School]   3. Travel Ball           → Fractions, decimals, ratios, batting average, ERA (KAS 6–8)
[High School]     4. Varsity               → Algebra, geometry, OBP, SLG, OPS, linear models (KAS 9–12)
[College]         5. MLB / The Show        → Probability, statistics, calculus, Pythagorean win %, wOBA, FIP
[Post-Secondary]  6. Front Office          → Sabermetric theory, discrete Markov chains, run expectancy matrices
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

### Tier 3: Travel Ball (Middle School / Grades 6–8 / Ages 11–14)
* **Kentucky Academic Standards Alignment:**
  - `KY.6.RP` & `KY.7.RP`: Ratio and proportional relationships, unit rates, percentages.
  - `KY.7.NS` & `KY.8.NS`: Rational numbers, fraction-to-decimal conversions rounded to thousandths.
  - `KY.8.EE`: Linear equations and proportional relationships.
* **Baseball Concepts:** Batting Average (AVG), Slugging Basics, Earned Run Average (ERA), Strikeout-to-Walk Ratio ($K/\text{BB}$).
* **Sample Problems:**
  - **Batting Average (AVG):** $\text{AVG} = \frac{\text{Hits}}{\text{At-Bats}}$.  
    *"A Louisville Bats hitter has 9 hits in 30 at-bats. Calculate their batting average as a 3-decimal number."* ($9 \div 30 = .300$)
  - **Earned Run Average (ERA):** $\text{ERA} = \frac{\text{Earned Runs} \times 9}{\text{Innings Pitched}}$.  
    *"A pitcher allows 4 earned runs over 12 innings. What is their ERA?"* ($\frac{4 \times 9}{12} = 3.00$)
  - **Stolen Base Success Rate:** *"A runner attempted 25 stolen bases and was safe 20 times. What percentage of stolen bases were successful?"* ($\frac{20}{25} = 80\%$)

---

### Tier 4: Varsity (High School / Grades 9–12 / Ages 14–18)
* **Kentucky Academic Standards Alignment:**
  - `KY.HS.A-CED` & `KY.HS.A-REI`: Creating equations, reasoning with inequalities, systems of equations.
  - `KY.HS.F-IF`: Interpreting functions, rates of change, graphing quadratic trajectory.
  - `KY.HS.S-ID` & `KY.HS.S-IC`: Summarizing bivariate data, correlation vs. causation, normal distributions.
* **Baseball Concepts:** On-Base Percentage (OBP), Slugging Percentage (SLG), On-Base Plus Slugging (OPS), Launch Angle & Exit Velocity (projectile motion / quadratic kinematics).
* **Sample Problems:**
  - **On-Base Percentage (OBP):**  
    $$\text{OBP} = \frac{\text{H} + \text{BB} + \text{HBP}}{\text{AB} + \text{BB} + \text{HBP} + \text{SF}}$$
    *"Given: 45 Hits, 15 Walks, 2 Hit-by-Pitch, 140 At-Bats, 3 Sacrifice Flies. Calculate OBP."* ($\frac{62}{160} = .3875 \rightarrow .388$)
  - **Slugging Percentage (SLG):**  
    $$\text{SLG} = \frac{1\text{B} + (2 \times 2\text{B}) + (3 \times 3\text{B}) + (4 \times \text{HR})}{\text{AB}}$$
  - **Quadratic Trajectory & Exit Velocity:** *"A baseball hit with exit velocity $v_0 = 105\text{ mph}$ ($154\text{ ft/s}$) at launch angle $28^\circ$. Using $y(t) = y_0 + v_{0y}t - 16t^2$, will it clear the 10-foot outfield wall at 400 feet?"*

---

### Tier 5: MLB / The Show (College Level / Undergraduate Math)
* **Undergraduate Mathematics:** Differential & Integral Calculus, Multivariable Statistics, Linear Regression, Non-Linear Parameter Estimation.
* **Baseball Concepts:** Bill James' Pythagorean Expectation, wOBA (Weighted On-Base Average) linear weights, FIP (Fielding Independent Pitching), Park Factor adjustments.
* **Sample Problems:**
  - **Pythagorean Win Expectation (Non-linear exponent estimation):**  
    $$\text{Win \%} = \frac{\text{Runs Scored}^\gamma}{\text{Runs Scored}^\gamma + \text{Runs Allowed}^\gamma} \quad (\gamma \approx 1.83)$$
    *"Derive the sensitivity $\frac{d(\text{Win \%})}{d(\text{RS})}$ to estimate the marginal value of 1 additional run scored."*
  - **wOBA (Empirical Linear Weights Derivation):**  
    $$\text{wOBA} = \frac{0.69 \cdot \text{uBB} + 0.72 \cdot \text{HBP} + 0.89 \cdot 1\text{B} + 1.27 \cdot 2\text{B} + 1.62 \cdot 3\text{B} + 2.10 \cdot \text{HR}}{\text{AB} + \text{BB} - \text{IBB} + \text{SF} + \text{HBP}}$$
  - **Fielding Independent Pitching (FIP):**  
    $$\text{FIP} = \frac{(13 \times \text{HR}) + (3 \times (\text{BB} + \text{HBP})) - (2 \times \text{K})}{\text{IP}} + C_{\text{FIP}}$$

---

### Tier 6: Front Office (Advanced Stats, Math & Sabermetric Theory)
* **Post-Secondary / Graduate Topics:** Stochastic Processes, Discrete Markov Chains, Matrix Algebra, Bayesian Inference, Machine Learning Expectation-Maximization.
* **Sabermetric Theory Concepts:** 24 Base-Out State Run Expectancy Matrix (RE24), Win Probability Added (WPA), WAR (Wins Above Replacement) structural decomposition, Leverage Index ($LI$).
* **Sample Problems:**
  - **Discrete Markov Transition Matrices for Inning States:**  
    Model the transition probability matrix $P$ across the 24 discrete states (runners on base $\times$ outs: $\{0, 1, 2\} \times \{\emptyset, 1\text{B}, 2\text{B}, 3\text{B}, 12, 13, 23, 123\}$ plus absorbing state 3 outs) and compute the expected runs to end of inning from any state $s$:
    $$R(s) = \sum_{s'} P(s, s') [r(s, s') + R(s')]$$
  - **Bayesian Player Projection (Marcel / PECOTA style):**  
    Update prior batting distribution $Beta(\alpha, \beta)$ with observed minor league plate appearances using shrinkage estimation toward league mean:
    $$\hat{\theta} = \frac{\text{Hits} + \alpha_0}{\text{AB} + \alpha_0 + \beta_0}$$
  - **Win Probability Added (WPA):** Evaluate the change in game win expectancy $\Delta WE = WE_{t+1} - WE_t$ for high-leverage bullpen relief appearances.

---

## 3. Gemini API Integration Architecture

- **Tier-Specific Dynamic Generation:**  
  When requesting a challenge, the frontend sends `{ tier: 1..6 }`. The backend constructs a system prompt mapped strictly to that educational level (from preschool counting objects to collegiate stochastic modeling).
- **Buddy Bat Socratic Tutor:**  
  Buddy Bat adjusts his tone and vocabulary automatically:
  - *Tier 1–2:* Friendly, enthusiastic, high-fives, emojis, visual counting cues.
  - *Tier 3–4:* Coach-style advice, practical real-game baseball arithmetic tips.
  - *Tier 5–6:* Analytical, data-driven front-office assistant reviewing statistical rigor and assumptions.

---

## 4. Vultr Cloud Deployment Architecture

- Low-latency delivery of the web application and API proxy on Vultr Cloud Compute.
- High-concurrency readiness for stadium QR code scans during game-day events at Louisville Slugger Field.
