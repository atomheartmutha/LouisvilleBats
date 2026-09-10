# ⚾ Concept Spec: Road to the Bats — Baseball Math Blaster

> **Inspiration:** Classic 90s/2000s edutainment (*Math Blaster*, The Learning Company’s *Zoombinis*, *Treasure Mountain*, *Super Solvers*).  
> **Mission for Louisville Bats:** Modernize youth fan engagement, replacing declining printed activity books with an addictive, high-energy ballpark math challenge.

---

## 1. Core Game Loop

- **Arcade Momentum:** Fast-paced, responsive, rewarding gameplay. Math problems aren't a chore; they are the power-ups, pitching selections, and lineup management tools.
- **Immediate Sensory Feedback:** High-contrast retro/modern ballpark visuals, crowd cheers, crack of the bat, Buddy Bat mascot animations, and celebratory badges.
- **Progression:** Players start in the instructional leagues and advance up the ladder toward Louisville Slugger Field and the Show!

---

## 2. Level Progression & Math Standards Mapping

Each tier corresponds to a baseball level and aligns with the **Kentucky Academic Standards (KAS) for Mathematics**, culminating in advanced collegiate/post-secondary sabermetrics:

### Level 1: T-Ball League (Introductory / Ages 5–8)
* **Baseball Context:** Counting innings, runs scored, strikes, and balls.
* **KAS Alignment:**
  - `KY.K.CC` & `KY.K.OA`: Counting, cardinality, and basic addition/subtraction within 10.
  - `KY.1.OA` & `KY.2.OA`: Addition and subtraction within 20 and 100.
* **Sample Problems:**
  - *"Buddy Bat caught 4 fly balls in the 2nd inning and 3 in the 5th inning. How many total catches?"* ($4 + 3 = 7$)
  - *"The Bats scored 6 runs, and the opposing team scored 4 runs. By how many runs are the Bats leading?"* ($6 - 4 = 2$)
  - *"There are 3 outs in an inning. If 2 outs have been recorded, how many outs remain?"* ($3 - 2 = 1$)

---

### Level 2: Travel Team (Intermediate / Ages 9–11)
* **Baseball Context:** Understanding basic statistics, box scores, and averages.
* **KAS Alignment:**
  - `KY.3.OA` & `KY.4.OA`: Multi-digit multiplication and division.
  - `KY.4.NF` & `KY.5.NF`: Understanding fractions as division and converting fractions to decimals.
* **Sample Problems:**
  - **Batting Average (AVG):** *"A Louisville batter had 10 at-bats and got 3 hits. What is their batting average as a decimal?"* ($3 \div 10 = .300$)
  - **Total Bases (TB):** *"A player hit 2 singles, 1 double, and 1 home run. Total bases = $(2 \times 1) + (1 \times 2) + (1 \times 4)$."* ($2 + 2 + 4 = 8$)
  - **Fielding Percentage:** *"A shortstop had 20 fielding chances and made 19 successful plays (1 error). What fraction of plays were made?"* ($19/20 = .950$)

---

### Level 3: Louisville Bats / Minor Leagues (Advanced / Ages 12–14)
* **Baseball Context:** Professional Triple-A statistics, player evaluation, and run production.
* **KAS Alignment:**
  - `KY.6.RP` & `KY.7.RP`: Ratios, rates, percentages, and proportional reasoning.
  - `KY.8.EE` & `KY.8.SP`: Linear equations, scatter plots, bivariate data, and rates of change.
* **Sample Problems:**
  - **Earned Run Average (ERA):** $\text{ERA} = \frac{\text{Earned Runs} \times 9}{\text{Innings Pitched}}$.  
    *"If a Bats pitcher allows 6 earned runs over 18 innings, what is their ERA?"* ($\frac{6 \times 9}{18} = 3.00$)
  - **On-Base Percentage (OBP) & Slugging (SLG) $\rightarrow$ OPS:**  
    *"If Elly De La Cruz has an OBP of .360 and a Slugging Percentage of .520, calculate his OPS."* ($.360 + .520 = .880$)
  - **Strikeout-to-Walk Ratio (K/BB):** *"Pitcher strikes out 84 batters and walks 21. What is the ratio in simplest form?"* ($4:1$)

---

### Level 4: The Show / MLB (Post-Secondary & Sabermetrics)
* **Baseball Context:** Modern front-office analytics, probabilistic modeling, and advanced metrics.
* **Post-Secondary / Collegiate Math Topics:** Calculus, Linear Algebra, Probability & Statistics, Non-linear regression.
* **Sample Problems:**
  - **Bill James' Pythagorean Expectation:**
    $$\text{Expected Win \%} = \frac{\text{Runs Scored}^{1.83}}{\text{Runs Scored}^{1.83} + \text{Runs Allowed}^{1.83}}$$
    *"Calculate the expected winning percentage of a team that scores 750 runs and allows 680 runs."*
  - **wOBA (Weighted On-Base Average):**
    $$\text{wOBA} = \frac{0.69 \cdot \text{uBB} + 0.72 \cdot \text{HBP} + 0.89 \cdot 1\text{B} + 1.27 \cdot 2\text{B} + 1.62 \cdot 3\text{B} + 2.10 \cdot \text{HR}}{\text{AB} + \text{BB} - \text{IBB} + \text{SF} + \text{HBP}}$$
    *"Explain why linear weights assign more than double the run value to a home run compared to a walk."*
  - **Fielding Independent Pitching (FIP):**
    $$\text{FIP} = \frac{(13 \times \text{HR}) + (3 \times (\text{BB} + \text{HBP})) - (2 \times \text{K})}{\text{IP}} + C$$
  - **Run Expectancy (24 Base-Out States):** Discrete Markov chain transitions between inning states $(0, 1, 2 \text{ outs} \times 8 \text{ base configurations})$.

---

## 3. How Gemini API Integrates

- **Curriculum-Grounded Question Generation:** Rather than static hardcoded questions, Gemini can generate infinite variations for any grade level on demand, ensuring players never see the same problem twice.
- **Buddy Bat Socratic Tutor:** When a player gets stuck or answers incorrectly, Buddy Bat breaks down the problem step-by-step using baseball analogies rather than just giving the answer.
- **Dynamic Post-Secondary Scenarios:** Generates front-office scouting puzzles (e.g. *"Evaluate these three Triple-A prospects using their wRC+ and FIP; who should the Bats promote to Cincinnati?"*).

---

## 4. How Vultr Cloud Integrates

- **High-Throughput In-Stadium Access:** During 7th-inning stretches or rain delays at Louisville Slugger Field, thousands of kids and parents may scan the QR code concurrently. Hosting containerized on Vultr Cloud Compute guarantees low-latency response times.
- **Automated Deploy Pipeline:** Ready to push with `./scripts/deploy-vultr.sh`.
