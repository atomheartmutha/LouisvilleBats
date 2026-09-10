// Louisville Bats - Road to the Bats Game Client Logic

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let score = 0;
  let outs = 0;
  let hits = 0;
  let homeRuns = 0;
  let longestDistance = 0;
  let isPitching = false;
  let hasPowerUp = false;
  let currentPitch = null;
  let currentMathChallenge = null;
  let playerAgeGroup = '6-8';
  let playerLevel = 'T-Ball';

  // DOM Elements
  const canvas = document.getElementById('ballpark-canvas');
  const ctx = canvas.getContext('2d');
  const pitchBtn = document.getElementById('pitch-btn');
  const swingBtn = document.getElementById('swing-btn');
  const powerUpBtn = document.getElementById('powerup-btn');
  const scoreEl = document.getElementById('player-score');
  const outsEl = document.getElementById('outs-count');
  const hitsEl = document.getElementById('hits-count');
  const hrEl = document.getElementById('hr-count');
  const longestEl = document.getElementById('longest-distance');
  const announcerText = document.getElementById('announcer-text');
  const ageSelect = document.getElementById('age-select');

  // Math Modal Elements
  const mathModal = document.getElementById('math-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const mathQuestionText = document.getElementById('math-question-text');
  const mathOptionsContainer = document.getElementById('math-options-container');
  const mathFeedback = document.getElementById('math-feedback');

  // Dugout & Mascot Elements
  const mascotBubble = document.getElementById('mascot-bubble');
  const coachTipBtn = document.getElementById('coach-tip-btn');
  const nextTriviaBtn = document.getElementById('next-trivia-btn');

  // Uniform & Card Elements
  const playerNameInput = document.getElementById('player-name-input');
  const playerNumberInput = document.getElementById('player-number-input');
  const cardPlayerName = document.getElementById('card-player-name');
  const cardJerseyNum = document.getElementById('card-jersey-num');
  const jerseyTorso = document.querySelector('.jersey-torso');
  const cardAvatarBg = document.getElementById('card-avatar-bg');
  const generateCardBtn = document.getElementById('generate-card-btn');
  const cardScoutingText = document.getElementById('card-scouting-text');
  const colorSwatches = document.querySelectorAll('.color-swatch');

  // Tab Switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-tab'));
      if (target) target.classList.add('active');
    });
  });

  // Age group selector update
  ageSelect.addEventListener('change', (e) => {
    playerAgeGroup = e.target.value;
    if (playerAgeGroup === '6-8') playerLevel = 'T-Ball';
    else if (playerAgeGroup === '9-11') playerLevel = 'Minor League';
    else playerLevel = 'Triple-A Bats Pro';

    announcerText.textContent = `League level updated to ${playerLevel}! Power-up questions are now tailored for ages ${playerAgeGroup}.`;
  });

  // ----------------------------------------------------
  // CANVAS BASEBALL GAME ENGINE
  // ----------------------------------------------------
  let ball = { x: 400, y: 190, radius: 8, vx: 0, vy: 0, state: 'ready' };
  let batter = { x: 360, y: 390, state: 'idle' }; // idle, swinging, contact
  let hitParticles = [];
  let animId = null;

  function drawBallpark() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky & Ohio River in distance
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
    skyGrad.addColorStop(0, '#1E3A5F');
    skyGrad.addColorStop(0.7, '#60A5FA');
    skyGrad.addColorStop(1, '#93C5FD');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 160);

    // Ohio River ribbon & bridges
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(0, 140, canvas.width, 22);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '10px sans-serif';
    ctx.fillText('🌊 Ohio River', 20, 155);

    // Outfield Wall (Louisville Slugger Field)
    ctx.fillStyle = '#0C2340';
    ctx.fillRect(0, 162, canvas.width, 35);
    ctx.fillStyle = '#BA0C2F';
    ctx.fillRect(0, 162, canvas.width, 5);

    // Stadium Wall Signage
    ctx.fillStyle = '#FFC72C';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚾ LOUISVILLE SLUGGER FIELD ⚾', 400, 185);
    ctx.font = '11px sans-serif';
    ctx.fillText('325 FT', 70, 185);
    ctx.fillText('405 FT', 400, 195);
    ctx.fillText('340 FT', 730, 185);

    // Field Grass
    const grassGrad = ctx.createLinearGradient(0, 197, 0, 480);
    grassGrad.addColorStop(0, '#2D6A4F');
    grassGrad.addColorStop(1, '#1B4332');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 197, canvas.width, 283);

    // Infield Dirt Diamond
    ctx.fillStyle = '#B07D62';
    ctx.beginPath();
    ctx.moveTo(400, 200); // 2nd base
    ctx.lineTo(580, 310); // 1st base
    ctx.lineTo(400, 430); // Home plate area
    ctx.lineTo(220, 310); // 3rd base
    ctx.closePath();
    ctx.fill();

    // Infield Grass cutout
    ctx.fillStyle = '#2D6A4F';
    ctx.beginPath();
    ctx.moveTo(400, 235);
    ctx.lineTo(530, 310);
    ctx.lineTo(400, 385);
    ctx.lineTo(270, 310);
    ctx.closePath();
    ctx.fill();

    // Bases
    ctx.fillStyle = '#FFFFFF';
    drawBase(400, 210); // 2nd
    drawBase(550, 310); // 1st
    drawBase(250, 310); // 3rd

    // Pitcher Mound
    ctx.fillStyle = '#9C6644';
    ctx.beginPath();
    ctx.ellipse(400, 290, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(393, 288, 14, 3); // Rubber

    // Home Plate
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(400, 420);
    ctx.lineTo(412, 430);
    ctx.lineTo(412, 442);
    ctx.lineTo(388, 442);
    ctx.lineTo(388, 430);
    ctx.closePath();
    ctx.fill();

    // Pitcher Figure
    ctx.fillStyle = '#0C2340';
    ctx.beginPath();
    ctx.arc(400, 275, 7, 0, Math.PI * 2); // Pitcher head
    ctx.fill();
    ctx.fillRect(396, 282, 8, 12); // Body

    // Batter Figure
    const batterX = batter.x;
    const batterY = batter.y;
    ctx.fillStyle = '#BA0C2F';
    ctx.beginPath();
    ctx.arc(batterX, batterY, 11, 0, Math.PI * 2); // Batter head
    ctx.fill();
    ctx.fillRect(batterX - 7, batterY + 11, 14, 22); // Torso

    // Bat
    ctx.save();
    ctx.translate(batterX + 5, batterY + 16);
    if (batter.state === 'swinging') {
      ctx.rotate(Math.PI / 3);
    } else {
      ctx.rotate(-Math.PI / 4);
    }
    // Bat color (Gold if powerup active, else wood)
    ctx.fillStyle = hasPowerUp ? '#FFC72C' : '#D4A373';
    ctx.fillRect(0, -4, 32, 7);
    if (hasPowerUp) {
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -4, 32, 7);
    }
    ctx.restore();

    // Power-up visual badge on field
    if (hasPowerUp) {
      ctx.fillStyle = '#FFC72C';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('⚡ 3X MATH POWER-UP ACTIVE! ⚡', 400, 465);
    }

    // Draw baseball
    if (ball.state !== 'ready') {
      ctx.save();
      // Glow trail for powered hits
      if (hasPowerUp && ball.state === 'hit') {
        ctx.shadowColor = '#FFC72C';
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#BA0C2F';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Draw explosion/spark particles
    hitParticles.forEach((p, idx) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) hitParticles.splice(idx, 1);
    });
  }

  function drawBase(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }

  // Animation Loop
  function updateGame() {
    // Ball pitching physics
    if (ball.state === 'pitching') {
      ball.y += ball.vy;
      ball.radius += 0.08; // scale up as it nears the plate

      // Missed / Past home plate
      if (ball.y > 450) {
        ball.state = 'miss';
        handleMiss();
      }
    } else if (ball.state === 'hit') {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.radius = Math.max(3, ball.radius - 0.06);

      // Ball reached distance destination
      if (ball.y < 120 || ball.x < 20 || ball.x > canvas.width - 20) {
        ball.state = 'landed';
      }
    }

    drawBallpark();
    animId = requestAnimationFrame(updateGame);
  }

  animId = requestAnimationFrame(updateGame);

  // Pitch Throwing
  pitchBtn.addEventListener('click', () => {
    if (isPitching) return;
    isPitching = true;
    pitchBtn.disabled = true;
    swingBtn.disabled = false;

    // Reset ball to pitcher
    ball = {
      x: 400,
      y: 285,
      radius: 4,
      vx: 0,
      vy: 4.8, // pitch speed
      state: 'pitching'
    };
    batter.state = 'idle';
    announcerText.textContent = 'Here comes the pitch! Watch the seams and get ready to swing!';
  });

  // Batting / Swing Action
  function performSwing() {
    if (!isPitching || ball.state !== 'pitching') return;
    swingBtn.disabled = true;
    batter.state = 'swinging';

    // Check contact timing: home plate is y = 420-440
    const distFromSweetSpot = Math.abs(ball.y - 425);

    if (distFromSweetSpot <= 32) {
      // CONTACT!
      ball.state = 'hit';
      spawnHitParticles(ball.x, ball.y);
      handleHit(distFromSweetSpot);
    } else {
      // Whiff / Strike
      ball.state = 'miss';
      handleMiss();
    }
  }

  swingBtn.addEventListener('click', performSwing);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !swingBtn.disabled) {
      e.preventDefault();
      performSwing();
    }
  });

  // Hit Particle Burst
  function spawnHitParticles(x, y) {
    const colors = hasPowerUp ? ['#FFC72C', '#FF6B00', '#FFFFFF', '#BA0C2F'] : ['#FFFFFF', '#FFC72C', '#0C2340'];
    for (let i = 0; i < 25; i++) {
      hitParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0
      });
    }
  }

  // Hit Result Processing
  async function handleHit(timingAccuracy) {
    let hitType = 'Single';
    let pts = 100;
    let distance = 250;

    // Calculate distance and type
    if (hasPowerUp || timingAccuracy < 10) {
      hitType = hasPowerUp ? 'Grand Slam' : 'Home Run';
      distance = Math.floor(380 + Math.random() * 70);
      pts = hasPowerUp ? 500 : 300;
      homeRuns++;
      ball.vx = (Math.random() - 0.5) * 3;
      ball.vy = -7.5; // High launch over wall
    } else if (timingAccuracy < 20) {
      hitType = 'Double';
      distance = Math.floor(280 + Math.random() * 40);
      pts = 200;
      ball.vx = (Math.random() > 0.5 ? 4 : -4);
      ball.vy = -5.5;
    } else {
      hitType = 'Single';
      distance = Math.floor(210 + Math.random() * 50);
      pts = 100;
      ball.vx = (Math.random() - 0.5) * 2;
      ball.vy = -4.5;
    }

    hits++;
    score += pts;
    if (distance > longestDistance) longestDistance = distance;

    updateScoreboard();

    // Call Gemini for exciting stadium announcer commentary
    try {
      const pName = playerNameInput.value.trim() || 'Bats Slugger';
      const res = await fetch('/api/gemini/play-by-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hitType, distance, playerName: pName })
      });
      const data = await res.json();
      announcerText.textContent = data.announcer || `CRACK! ${pName} smashes a ${distance} ft ${hitType}!`;
    } catch (_) {
      announcerText.textContent = `CRACK! That ball is hammered ${distance} ft for a ${hitType}!`;
    }

    // Reset powerup after used
    hasPowerUp = false;

    // Reset pitch state
    setTimeout(() => {
      isPitching = false;
      pitchBtn.disabled = false;
    }, 1800);
  }

  // Miss / Out Processing
  function handleMiss() {
    outs++;
    if (outs >= 3) {
      announcerText.textContent = `Three outs! Side retired! Great hustle — final inning score: ${score} points!`;
      outs = 0; // reset for endless kids play
    } else {
      announcerText.textContent = `Strike! Swing and a miss. Stay focused and get the next one! (Outs: ${outs}/3)`;
    }
    updateScoreboard();

    setTimeout(() => {
      isPitching = false;
      pitchBtn.disabled = false;
      swingBtn.disabled = true;
    }, 1200);
  }

  function updateScoreboard() {
    scoreEl.textContent = score;
    outsEl.textContent = `${outs} / 3`;
    hitsEl.textContent = hits;
    hrEl.textContent = homeRuns;
    longestEl.textContent = `${longestDistance} ft`;
  }

  // ----------------------------------------------------
  // MATH POWER-UP SYSTEM
  // ----------------------------------------------------
  powerUpBtn.addEventListener('click', async () => {
    mathModal.classList.remove('hidden');
    mathQuestionText.textContent = 'Loading math challenge from Gemini AI...';
    mathOptionsContainer.innerHTML = '';
    mathFeedback.style.display = 'none';

    try {
      const res = await fetch('/api/gemini/math-powerup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageGroup: playerAgeGroup, level: playerLevel })
      });
      currentMathChallenge = await res.json();
      renderMathChallenge(currentMathChallenge);
    } catch (e) {
      currentMathChallenge = {
        question: "Buddy Bat hit 2 home runs on Friday and 3 on Saturday. How many total?",
        options: ["4", "5", "6", "7"],
        answerIndex: 1,
        funFact: "Buddy Bat loves rounding the bases with our young fans!"
      };
      renderMathChallenge(currentMathChallenge);
    }
  });

  function renderMathChallenge(challenge) {
    mathQuestionText.textContent = challenge.question;
    mathOptionsContainer.innerHTML = '';

    challenge.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'math-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => checkMathAnswer(idx, challenge));
      mathOptionsContainer.appendChild(btn);
    });
  }

  function checkMathAnswer(selectedIdx, challenge) {
    mathFeedback.style.display = 'block';
    if (selectedIdx === challenge.answerIndex) {
      hasPowerUp = true;
      score += 50;
      updateScoreboard();
      mathFeedback.style.background = '#1E4D2B';
      mathFeedback.style.color = '#FFFFFF';
      mathFeedback.innerHTML = `🎉 <strong>CORRECT!</strong> 3x Super Slugger Power-Up ACTIVATED! <br><small>${challenge.funFact || ''}</small>`;
      announcerText.textContent = `⚡ POWER-UP ENGAGED! Next pitch has 3x Louisville Slugger distance!`;
      setTimeout(() => {
        mathModal.classList.add('hidden');
      }, 1500);
    } else {
      mathFeedback.style.background = '#7F1D1D';
      mathFeedback.style.color = '#FFFFFF';
      mathFeedback.textContent = `Good try! Keep swinging and you'll get it next time!`;
    }
  }

  closeModalBtn.addEventListener('click', () => {
    mathModal.classList.add('hidden');
  });

  // ----------------------------------------------------
  // UNIFORM CUSTOMIZER & ROOKIE CARD
  // ----------------------------------------------------
  playerNameInput.addEventListener('input', (e) => {
    cardPlayerName.textContent = e.target.value.toUpperCase() || 'ROOKIE SLUGGER';
  });

  playerNumberInput.addEventListener('input', (e) => {
    cardJerseyNum.textContent = e.target.value || '00';
  });

  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const theme = swatch.getAttribute('data-theme');

      if (theme === 'red') {
        jerseyTorso.style.background = '#BA0C2F';
        cardAvatarBg.style.background = 'radial-gradient(circle, #BA0C2F 0%, #0C2340 100%)';
      } else if (theme === 'navy') {
        jerseyTorso.style.background = '#0C2340';
        cardAvatarBg.style.background = 'radial-gradient(circle, #0C2340 0%, #153E75 100%)';
      } else if (theme === 'white') {
        jerseyTorso.style.background = '#FFFFFF';
        jerseyTorso.style.borderColor = '#BA0C2F';
        cardJerseyNum.style.color = '#BA0C2F';
        cardAvatarBg.style.background = 'radial-gradient(circle, #2563EB 0%, #0C2340 100%)';
      } else if (theme === 'gold') {
        jerseyTorso.style.background = '#FFC72C';
        cardJerseyNum.style.color = '#0C2340';
        cardAvatarBg.style.background = 'radial-gradient(circle, #FFC72C 0%, #0C2340 100%)';
      }
    });
  });

  generateCardBtn.addEventListener('click', async () => {
    cardScoutingText.textContent = 'Contacting Louisville Bats Scouting Department via Gemini AI...';
    generateCardBtn.disabled = true;

    try {
      const res = await fetch('/api/gemini/scouting-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerNameInput.value,
          number: playerNumberInput.value,
          jerseyColor: document.querySelector('.color-swatch.active')?.textContent || 'Bats Red',
          highScore: score
        })
      });
      const data = await res.json();
      cardScoutingText.textContent = data.report;
    } catch (_) {
      cardScoutingText.textContent = `Scout Report: Power prospect with lightning quick wrists! Poised to be the next superstar fan favorite at Louisville Slugger Field!`;
    } finally {
      generateCardBtn.disabled = false;
    }
  });

  // ----------------------------------------------------
  // BUDDY BAT MASCOT & TRIVIA
  // ----------------------------------------------------
  coachTipBtn.addEventListener('click', async () => {
    coachTipBtn.disabled = true;
    mascotBubble.textContent = "Buddy Bat is thinking of a winning tip...";

    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerLevel: playerLevel,
          situation: 'stepping up to the plate',
          score: score
        })
      });
      const data = await res.json();
      mascotBubble.textContent = `"${data.message}"`;
    } catch (_) {
      mascotBubble.textContent = `"Keep your eye on the ball, swing through the zone, and remember the most important rule: have fun at the ballpark!"`;
    } finally {
      coachTipBtn.disabled = false;
    }
  });

  // Built-in Bats trivia questions
  const triviaQuestions = [
    {
      q: "What is the home ballpark of the Louisville Bats?",
      opts: ["Louisville Slugger Field", "Churchill Downs", "KFC Yum! Center", "Great American Ball Park"],
      ans: 0,
      fact: "Louisville Slugger Field opened in 2000 right on East Main Street near the Ohio River!"
    },
    {
      q: "What Major League Baseball team are the Louisville Bats affiliated with?",
      opts: ["Cincinnati Reds", "St. Louis Cardinals", "Chicago Cubs", "Cleveland Guardians"],
      ans: 0,
      fact: "The Bats are the Triple-A affiliate of the Cincinnati Reds!"
    },
    {
      q: "What is the name of the official Louisville Bats mascot?",
      opts: ["Buddy Bat", "Slugger the Dog", "Mr. Redlegs", "Phillie Phanatic"],
      ans: 0,
      fact: "Buddy Bat is the famous winged mascot cheering on the team at every home game!"
    },
    {
      q: "How far apart are the bases on a professional baseball diamond?",
      opts: ["90 feet", "60 feet", "100 feet", "75 feet"],
      ans: 0,
      fact: "Base paths are exactly 90 feet, requiring speed, agility, and great base-running math!"
    }
  ];

  let currentTriviaIdx = 0;

  function loadTrivia(idx) {
    const item = triviaQuestions[idx % triviaQuestions.length];
    document.getElementById('trivia-q').textContent = item.q;
    const optsContainer = document.getElementById('trivia-opts');
    optsContainer.innerHTML = '';
    const feedback = document.getElementById('trivia-feedback');
    feedback.style.display = 'none';

    item.opts.forEach((opt, oIdx) => {
      const b = document.createElement('button');
      b.className = 'trivia-opt-btn';
      b.textContent = opt;
      b.addEventListener('click', () => {
        feedback.style.display = 'block';
        if (oIdx === item.ans) {
          feedback.style.background = '#1E4D2B';
          feedback.style.color = '#FFFFFF';
          feedback.innerHTML = `🎉 Correct! +100 Points! <br><small>${item.fact}</small>`;
          score += 100;
          updateScoreboard();
        } else {
          feedback.style.background = '#7F1D1D';
          feedback.style.color = '#FFFFFF';
          feedback.innerHTML = `Not quite! The correct answer is <strong>${item.opts[item.ans]}</strong>.`;
        }
      });
      optsContainer.appendChild(b);
    });
  }

  nextTriviaBtn.addEventListener('click', () => {
    currentTriviaIdx++;
    loadTrivia(currentTriviaIdx);
  });

  loadTrivia(0);

  // ----------------------------------------------------
  // IN-STADIUM QR CODE GENERATOR (HTML5 Canvas)
  // ----------------------------------------------------
  function drawBallparkQR() {
    const qrCanvas = document.getElementById('qr-canvas');
    if (!qrCanvas) return;
    const qctx = qrCanvas.getContext('2d');
    const size = qrCanvas.width;

    qctx.fillStyle = '#FFFFFF';
    qctx.fillRect(0, 0, size, size);

    // Decorative baseball border
    qctx.strokeStyle = '#BA0C2F';
    qctx.lineWidth = 4;
    qctx.strokeRect(2, 2, size - 4, size - 4);

    // QR pattern simulation (clear grid with standard corner finder blocks)
    qctx.fillStyle = '#0C2340';
    
    // Top-Left Finder
    drawFinder(qctx, 16, 16, 44);
    // Top-Right Finder
    drawFinder(qctx, size - 60, 16, 44);
    // Bottom-Left Finder
    drawFinder(qctx, 16, size - 60, 44);

    // Data matrix pseudo-random dots
    const cellSize = 8;
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 20; c++) {
        // Skip corner finder zones
        if ((r < 7 && c < 7) || (r < 7 && c > 12) || (r > 12 && c < 7)) continue;
        if ((r * 7 + c * 13 + (r % 3)) % 2 === 0) {
          qctx.fillRect(20 + c * cellSize, 20 + r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Center Emblem (Buddy Bat / Baseball)
    qctx.fillStyle = '#BA0C2F';
    qctx.beginPath();
    qctx.arc(size / 2, size / 2, 18, 0, Math.PI * 2);
    qctx.fill();
    qctx.fillStyle = '#FFFFFF';
    qctx.font = '16px sans-serif';
    qctx.textAlign = 'center';
    qctx.textBaseline = 'middle';
    qctx.fillText('🦇', size / 2, size / 2);
  }

  function drawFinder(ctx, x, y, size) {
    ctx.fillStyle = '#0C2340';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
    ctx.fillStyle = '#0C2340';
    ctx.fillRect(x + 12, y + 12, size - 24, size - 24);
  }

  drawBallparkQR();
});
