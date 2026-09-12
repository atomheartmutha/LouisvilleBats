// Batyard Slugger — Video Game Controller & JCPS Adaptive Testing Engine

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 1. GAME STATE MACHINE & PERSISTENT POINTS
  // ============================================================
  let globalPoints = parseInt(localStorage.getItem('batyard_points') || '0', 10);
  let soundEnabled = localStorage.getItem('batyard_sound') !== 'false';
  let activeScreen = 'screen-title';

  const gamePointsEl = document.getElementById('game-points');
  const rankIconEl = document.getElementById('rank-icon');
  const rankNameEl = document.getElementById('rank-name');
  const soundBtn = document.getElementById('sound-btn');
  const organFanfareBtn = document.getElementById('organ-fanfare-btn');

  function updateRank() {
    let title = 'ROOKIE';
    let icon = '🥉';

    if (globalPoints >= 1000) {
      title = 'FRONT OFFICE GM';
      icon = '👑';
    } else if (globalPoints >= 500) {
      title = 'TRIPLE-A PRO';
      icon = '🦇';
    } else if (globalPoints >= 250) {
      title = 'ALL-STAR';
      icon = '🥇';
    } else if (globalPoints >= 100) {
      title = 'SLUGGER';
      icon = '🥈';
    }

    if (rankNameEl) rankNameEl.textContent = title;
    if (rankIconEl) rankIconEl.textContent = icon;
  }

  function addPoints(pts) {
    globalPoints += pts;
    localStorage.setItem('batyard_points', globalPoints.toString());
    if (gamePointsEl) gamePointsEl.textContent = globalPoints;
    updateRank();
    playCelebrationChime();
  }

  if (gamePointsEl) gamePointsEl.textContent = globalPoints;
  updateRank();

  // Screen Switching
  function switchScreen(targetId) {
    const screens = document.querySelectorAll('.game-screen');
    screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
      activeScreen = targetId;

      if (targetId === 'screen-derby') {
        renderDerbyField();
      } else if (targetId === 'screen-coloring') {
        redrawColoringTemplate();
      } else if (targetId === 'screen-roster') {
        loadDugoutRoster();
      }
    }
  }

  // Navigation Button Handlers
  document.querySelectorAll('[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      switchScreen(target);
    });
  });

  const startGameBtn = document.getElementById('start-game-btn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      playBallparkOrganCharge();
      switchScreen('screen-derby');
      speakAnnouncer("Batter up! Welcome to Louisville Slugger Field!");
    });
  }

  // Keyboard shortcut: Space or Enter on Title Screen to start
  window.addEventListener('keydown', (e) => {
    if (activeScreen === 'screen-title' && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      playBallparkOrganCharge();
      switchScreen('screen-derby');
    }
  });

  // ============================================================
  // 2. BALLPARK ORGAN & SOUND SYNTHESIZER (Web Audio API)
  // ============================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playBallparkOrganCharge() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { f: 392.00, d: 0.14 }, // G4
      { f: 523.25, d: 0.14 }, // C5
      { f: 659.25, d: 0.14 }, // E5
      { f: 783.99, d: 0.28 }, // G5 (hold)
      { f: 659.25, d: 0.14 }, // E5
      { f: 783.99, d: 0.60 }  // G5 sustain
    ];

    let start = ctx.currentTime + 0.05;
    notes.forEach(note => {
      [1, 2, 3].forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(note.f * mult, start);

        const vol = idx === 0 ? 0.18 : (idx === 1 ? 0.08 : 0.04);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + note.d);
      });
      start += note.d + 0.04;
    });

    speakAnnouncer("CHARGE!");
  }

  function playBatCrack() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  function playCelebrationChime() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.08));
      gain.gain.setValueAtTime(0.2, ctx.currentTime + (i * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.08) + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (i * 0.08));
      osc.stop(ctx.currentTime + (i * 0.08) + 0.4);
    });
  }

  function playCrowdCheer() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  function speakAnnouncer(text) {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.pitch = 1.1;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('batyard_sound', soundEnabled.toString());
      soundBtn.innerHTML = soundEnabled ? '🔊 <span>ON</span>' : '🔇 <span>OFF</span>';
    });
    soundBtn.innerHTML = soundEnabled ? '🔊 <span>ON</span>' : '🔇 <span>OFF</span>';
  }

  if (organFanfareBtn) {
    organFanfareBtn.addEventListener('click', playBallparkOrganCharge);
  }

  // ============================================================
  // 3. JCPS-STYLE COMPUTER-ADAPTIVE TESTING (CAT) ENGINE
  // ============================================================
  let catTier = 3; // Starts at Tier 3 (Proficient)
  let catStreak = 0;
  let catLastResult = null;
  let catLastQId = '';
  let activeAdaptiveQuestion = null;

  const catTierBadge = document.getElementById('cat-tier-badge');
  const catStreakBadge = document.getElementById('cat-streak-badge');
  const catQText = document.getElementById('cat-question-text');
  const catOptsGrid = document.getElementById('cat-options-grid');
  const catFbBox = document.getElementById('cat-feedback-box');
  const adaptiveModal = document.getElementById('modal-adaptive-timeout');
  const returnToAtBatBtn = document.getElementById('return-to-atbat-btn');
  const closeTimeoutBtn = document.getElementById('close-timeout-btn');
  const powerActiveTag = document.getElementById('power-active-tag');

  async function loadAdaptiveQuestion() {
    catFbBox.className = 'chalk-feedback-box hidden';
    catOptsGrid.innerHTML = '';
    catQText.textContent = 'JCPS Adaptive Engine is selecting your challenge...';

    try {
      const res = await fetch('/api/quiz/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTier: catTier,
          streak: catStreak,
          lastResult: catLastResult,
          excludeId: catLastQId
        })
      });

      activeAdaptiveQuestion = await res.json();
      catLastQId = activeAdaptiveQuestion.id || '';
      catTier = activeAdaptiveQuestion.difficulty || catTier;

      if (catTierBadge) catTierBadge.textContent = `${activeAdaptiveQuestion.tierTitle || 'TIER ' + catTier}`;
      if (catStreakBadge) catStreakBadge.textContent = `🔥 STREAK: ${catStreak}`;
      catQText.textContent = activeAdaptiveQuestion.q;

      activeAdaptiveQuestion.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'cat-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          handleAdaptiveAnswer(idx);
        });
        catOptsGrid.appendChild(btn);
      });
    } catch (_) {
      catQText.textContent = 'A Louisville Bats hitter gets 3 hits in 10 at-bats. Express as a decimal (.300):';
    }
  }

  function handleAdaptiveAnswer(selectedIdx) {
    catFbBox.classList.remove('hidden');
    const isCorrect = selectedIdx === activeAdaptiveQuestion.ans;
    catLastResult = isCorrect;

    if (isCorrect) {
      catStreak++;
      hasPowerBat = true;
      if (powerActiveTag) powerActiveTag.classList.remove('hidden');
      const pts = 25 * catTier;
      addPoints(pts);

      catFbBox.className = 'chalk-feedback-box correct';
      catFbBox.innerHTML = `⚡ <strong>CORRECT! (+${pts} Pts)</strong> ${activeAdaptiveQuestion.explanation}<br><strong>Adaptive Progress:</strong> Difficulty scaling UP for next at-bat! 3X Power Bat ignited!`;
      
      speakAnnouncer(`Correct! 3X Aluminum Power Bat ignited! Leveling up to Tier ${Math.min(5, catTier + 1)}!`);
      playBallparkOrganCharge();

      if (catStreakBadge) catStreakBadge.textContent = `🔥 STREAK: ${catStreak}`;
    } else {
      catStreak = 0;
      catFbBox.className = 'chalk-feedback-box incorrect';
      catFbBox.innerHTML = `<strong>Scaffolding Support:</strong> ${activeAdaptiveQuestion.explanation}<br>Difficulty gently adjusting down to reinforce fundamentals.`;
      speakAnnouncer("Nice effort! Let's scaffold that standard.");
      if (catStreakBadge) catStreakBadge.textContent = `🔥 STREAK: 0`;
    }
  }

  function openAdaptiveTimeout() {
    if (adaptiveModal) adaptiveModal.classList.remove('hidden');
    speakAnnouncer("Time out called! JCPS Adaptive Challenge active.");
    loadAdaptiveQuestion();
  }

  function closeAdaptiveTimeout() {
    if (adaptiveModal) adaptiveModal.classList.add('hidden');
  }

  document.getElementById('game-timeout-btn')?.addEventListener('click', openAdaptiveTimeout);
  document.getElementById('bb97-hud-timeout-btn')?.addEventListener('click', openAdaptiveTimeout);
  closeTimeoutBtn?.addEventListener('click', closeAdaptiveTimeout);
  returnToAtBatBtn?.addEventListener('click', closeAdaptiveTimeout);

  // Tactile Gauge Puzzle in Chalkboard
  const adaptiveGauge = document.getElementById('adaptive-gauge');
  const adaptiveGaugeVal = document.getElementById('adaptive-gauge-val');
  const lockAdaptiveGaugeBtn = document.getElementById('lock-adaptive-gauge-btn');
  const gaugeFb = document.getElementById('gauge-fb');

  if (adaptiveGauge && adaptiveGaugeVal) {
    adaptiveGauge.addEventListener('input', () => {
      const val = (parseInt(adaptiveGauge.value, 10) / 1000).toFixed(3);
      adaptiveGaugeVal.textContent = `.${val.split('.')[1]}`;
    });

    lockAdaptiveGaugeBtn?.addEventListener('click', () => {
      gaugeFb.classList.remove('hidden');
      const val = parseInt(adaptiveGauge.value, 10);
      if (val === 300) {
        hasPowerBat = true;
        if (powerActiveTag) powerActiveTag.classList.remove('hidden');
        gaugeFb.textContent = '⚡ PERFECT! 3 hits ÷ 10 at-bats = .300! Power Bat Activated!';
        addPoints(50);
        speakAnnouncer(".300 batting average locked in!");
      } else {
        gaugeFb.textContent = `Locked at .${val}. 3 hits in 10 at-bats is 3 ÷ 10 = .300. Try .300!`;
      }
    });
  }

  // ============================================================
  // 4. LEVEL 2: BACKYARD BASEBALL '97 DERBY ENGINE
  // ============================================================
  const derbyCanvas = document.getElementById('derby-canvas');
  const dctx = derbyCanvas.getContext('2d');
  const arcadePitchBtn = document.getElementById('arcade-pitch-btn');
  const arcadeSwingBtn = document.getElementById('arcade-swing-btn');
  const announcerEl = document.getElementById('announcer-text');

  let outs = 0, hits = 0, hr = 0, longestDist = 0;
  let isDerbyPitching = false;
  let hasPowerBat = false;
  let currentPitchType = 'fastball';
  let ball = { x: 360, y: 160, r: 7, vx: 0, vy: 0, state: 'ready' };
  let batter = { x: 300, y: 365, state: 'idle' };

  // Pitch selector pills
  document.querySelectorAll('.pitch-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pitch-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPitchType = pill.getAttribute('data-pitch');
    });
  });

  function renderDerbyField() {
    dctx.clearRect(0, 0, derbyCanvas.width, derbyCanvas.height);

    // 1. Sky & Trees
    const sky = dctx.createLinearGradient(0, 0, 0, 95);
    sky.addColorStop(0, '#e9c78e');
    sky.addColorStop(1, '#f5e6bd');
    dctx.fillStyle = sky;
    dctx.fillRect(0, 0, derbyCanvas.width, 95);

    // A playful riverfront silhouette, rather than a geographically exact stadium view.
    dctx.fillStyle = '#e8af5f';
    dctx.beginPath();
    dctx.arc(470, 30, 21, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#728b7d';
    const skyline = [[100, 40, 26], [132, 24, 34], [172, 12, 28], [207, 35, 40], [254, 48, 24]];
    for (const [x, y, width] of skyline) {
      dctx.fillRect(x, y, width, 76 - y);
    }
    dctx.fillStyle = '#9bbbad';
    dctx.fillRect(0, 65, derbyCanvas.width, 15);
    dctx.strokeStyle = '#456b62';
    dctx.lineWidth = 3;
    for (let bx = 310; bx < 710; bx += 80) {
      dctx.beginPath();
      dctx.moveTo(bx, 61);
      dctx.quadraticCurveTo(bx + 40, 11, bx + 80, 61);
      dctx.lineTo(bx, 61);
      dctx.stroke();
      dctx.fillStyle = '#456b62';
      dctx.fillRect(bx, 60, 4, 20);
    }

    // Wooden Blue Outfield Fence
    dctx.fillStyle = '#1D3557';
    dctx.fillRect(0, 80, derbyCanvas.width, 24);
    dctx.fillStyle = '#457B9D';
    dctx.fillRect(0, 78, derbyCanvas.width, 4);

    // Scoreboard
    dctx.fillStyle = '#0C2340';
    dctx.fillRect(295, 66, 130, 24);
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 1.5;
    dctx.strokeRect(295, 66, 130, 24);
    dctx.fillStyle = '#FFC72C';
    dctx.font = 'bold 9px monospace';
    dctx.textAlign = 'center';
    dctx.fillText('LOUISVILLE BATS', 360, 81);
    dctx.fillStyle = '#f5e9cd';
    dctx.font = 'bold 8px monospace';
    dctx.fillText('RIVER CITY SANDLOT', 135, 95);
    dctx.fillText('LOUISVILLE • KY', 580, 95);

    // 2. Outfield & Infield Grass
    dctx.fillStyle = '#386641';
    dctx.fillRect(0, 100, derbyCanvas.width, 320);

    dctx.fillStyle = '#407B4A';
    dctx.fillRect(0, 125, derbyCanvas.width, 20);
    dctx.fillRect(0, 165, derbyCanvas.width, 25);

    // 3. Dirt Diamond
    dctx.fillStyle = '#DDA15E';
    dctx.beginPath();
    dctx.moveTo(360, 130);
    dctx.lineTo(590, 260);
    dctx.lineTo(360, 410);
    dctx.lineTo(130, 260);
    dctx.closePath();
    dctx.fill();

    // Grass cutout
    dctx.fillStyle = '#386641';
    dctx.beginPath();
    dctx.moveTo(360, 165);
    dctx.lineTo(520, 260);
    dctx.lineTo(360, 355);
    dctx.lineTo(200, 260);
    dctx.closePath();
    dctx.fill();

    // 4. Chalk Lines & Batter Box
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 3.5;
    dctx.beginPath();
    dctx.moveTo(360, 380);
    dctx.lineTo(80, 220);
    dctx.stroke();

    dctx.beginPath();
    dctx.moveTo(360, 380);
    dctx.lineTo(640, 220);
    dctx.stroke();

    // Home Plate
    dctx.fillStyle = '#FFFFFF';
    dctx.beginPath();
    dctx.moveTo(360, 370);
    dctx.lineTo(375, 385);
    dctx.lineTo(375, 400);
    dctx.lineTo(345, 400);
    dctx.lineTo(345, 385);
    dctx.closePath();
    dctx.fill();

    // Chalk Batter's Boxes
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 2.5;
    dctx.strokeRect(280, 355, 52, 58);
    dctx.strokeRect(385, 355, 52, 58);

    // 5. Mound & Rubber
    dctx.fillStyle = '#BC6C25';
    dctx.beginPath();
    dctx.ellipse(360, 225, 42, 20, 0, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(350, 222, 20, 4);

    // 6. Bases & Fielders
    drawBase(360, 140);
    drawBase(540, 250);
    drawBase(180, 250);

    drawFielder(240, 175, '#BA0C2F');
    drawFielder(480, 175, '#BA0C2F');
    drawFielder(190, 235, '#0C2340');
    drawFielder(530, 235, '#0C2340');

    // Pitcher
    drawPitcher(360, 210);

    // Batter (Pablo Sanchez / Kid Slugger)
    drawBatter(batter.x, batter.y);

    // Mini-radar and mound HUD
    drawMiniRadar(18, 12);
    drawMoundHUD(535, 10);

    // Ball
    if (ball.state !== 'ready') {
      dctx.save();
      if (hasPowerBat && ball.state === 'hit') {
        dctx.shadowColor = '#FFC72C';
        dctx.shadowBlur = 18;
      }
      dctx.fillStyle = '#FFFFFF';
      dctx.beginPath();
      dctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      dctx.fill();
      dctx.strokeStyle = '#BA0C2F';
      dctx.lineWidth = 1.5;
      dctx.stroke();
      dctx.restore();
    }
  }

  function drawBase(x, y) {
    dctx.save();
    dctx.translate(x, y);
    dctx.rotate(Math.PI / 4);
    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(-6, -6, 12, 12);
    dctx.restore();
  }

  function drawFielder(x, y, capColor) {
    dctx.fillStyle = capColor;
    dctx.beginPath();
    dctx.arc(x, y - 10, 6, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FFD166';
    dctx.beginPath();
    dctx.arc(x, y - 6, 5, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(x - 4, y - 2, 8, 8);
  }

  function drawPitcher(x, y) {
    dctx.fillStyle = '#FF758F';
    dctx.beginPath();
    dctx.arc(x, y - 14, 8, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FFD166';
    dctx.beginPath();
    dctx.arc(x, y - 9, 7, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(x - 5, y - 3, 10, 11);
    dctx.fillStyle = '#8B4513';
    dctx.fillRect(x - 9, y - 2, 5, 6);
  }

  function drawBatter(x, y) {
    dctx.save();
    // Backwards Cap
    dctx.fillStyle = '#2563EB';
    dctx.beginPath();
    dctx.arc(x, y - 20, 18, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#1D4ED8';
    dctx.beginPath();
    dctx.ellipse(x - 14, y - 24, 10, 4, -0.4, 0, Math.PI * 2);
    dctx.fill();

    // Face
    dctx.fillStyle = '#FBBF24';
    dctx.beginPath();
    dctx.arc(x, y - 12, 16, 0, Math.PI * 2);
    dctx.fill();

    // Eyes & Smile
    dctx.fillStyle = '#000000';
    dctx.beginPath();
    dctx.arc(x + 4, y - 14, 2, 0, Math.PI * 2);
    dctx.arc(x + 10, y - 14, 2, 0, Math.PI * 2);
    dctx.fill();
    dctx.beginPath();
    dctx.arc(x + 6, y - 9, 7, 0.2, Math.PI - 0.2);
    dctx.stroke();

    // Jersey & Belly
    dctx.fillStyle = '#3B82F6';
    dctx.beginPath();
    dctx.arc(x - 2, y + 10, 14, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FBBF24';
    dctx.beginPath();
    dctx.arc(x - 1, y + 16, 5, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#B45309';
    dctx.fillRect(x - 1, y + 16, 1.5, 1.5);

    // Shorts & Red Shoes
    dctx.fillStyle = '#1E3A8A';
    dctx.fillRect(x - 8, y + 19, 7, 8);
    dctx.fillRect(x + 1, y + 19, 7, 8);
    dctx.fillStyle = '#EF4444';
    dctx.beginPath();
    dctx.ellipse(x - 6, y + 28, 7, 4, 0, 0, Math.PI * 2);
    dctx.ellipse(x + 5, y + 28, 7, 4, 0, 0, Math.PI * 2);
    dctx.fill();

    // Bat
    dctx.save();
    dctx.translate(x + 2, y + 4);
    if (batter.state === 'swinging') {
      dctx.rotate(Math.PI / 2.8);
    } else {
      dctx.rotate(0.3);
    }
    dctx.fillStyle = hasPowerBat ? '#FFC72C' : '#DEB887';
    dctx.fillRect(0, -5, 42, 9);
    if (hasPowerBat) {
      dctx.strokeStyle = '#FF6B00';
      dctx.lineWidth = 2;
      dctx.strokeRect(0, -5, 42, 9);
    }
    dctx.restore();

    dctx.restore();
  }

  function drawMiniRadar(x, y) {
    dctx.save();
    dctx.fillStyle = '#14532D';
    dctx.beginPath();
    dctx.moveTo(x + 40, y + 55);
    dctx.arc(x + 40, y + 55, 48, -Math.PI * 0.85, -Math.PI * 0.15);
    dctx.closePath();
    dctx.fill();
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 2;
    dctx.stroke();

    dctx.fillStyle = '#B07D62';
    dctx.beginPath();
    dctx.moveTo(x + 40, y + 20);
    dctx.lineTo(x + 62, y + 36);
    dctx.lineTo(x + 40, y + 52);
    dctx.lineTo(x + 18, y + 36);
    dctx.closePath();
    dctx.fill();

    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(x + 38, y + 18, 4, 4);
    dctx.fillRect(x + 60, y + 34, 4, 4);
    dctx.fillRect(x + 16, y + 34, 4, 4);
    dctx.fillRect(x + 38, y + 50, 4, 4);
    dctx.restore();
  }

  function drawMoundHUD(x, y) {
    dctx.save();
    dctx.fillStyle = '#0F5132';
    dctx.fillRect(x, y, 165, 42);
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 2;
    dctx.strokeRect(x, y, 165, 42);

    dctx.fillStyle = '#081C15';
    dctx.fillRect(x + 4, y + 4, 34, 34);
    dctx.strokeStyle = '#4ADE80';
    dctx.strokeRect(x + 4, y + 4, 34, 34);
    dctx.font = '18px sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('🧢', x + 21, y + 27);

    dctx.textAlign = 'left';
    dctx.fillStyle = '#FFC72C';
    dctx.font = 'bold 8px monospace';
    dctx.fillText('ON THE MOUND:', x + 44, y + 15);
    dctx.fillStyle = '#FFFFFF';
    dctx.font = 'bold 11px sans-serif';
    dctx.fillText('BUDDY BAT', x + 44, y + 27);
    dctx.fillStyle = '#A7F3D0';
    dctx.font = 'bold 8px monospace';
    dctx.fillText('0 PT, 0 K, 0 BB', x + 44, y + 37);
    dctx.restore();
  }

  function updateDerbyLoop() {
    if (ball.state === 'pitching') {
      ball.y += ball.vy;
      ball.x += ball.vx;
      ball.r += 0.07;
      if (ball.y > 400) {
        handleDerbyMiss();
      }
    } else if (ball.state === 'hit') {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.r = Math.max(3, ball.r - 0.05);
      if (ball.y < 100 || ball.x < 10 || ball.x > derbyCanvas.width - 10) {
        ball.state = 'landed';
      }
    }

    if (activeScreen === 'screen-derby') {
      renderDerbyField();
    }
    requestAnimationFrame(updateDerbyLoop);
  }
  requestAnimationFrame(updateDerbyLoop);

  // Throw Pitch
  arcadePitchBtn?.addEventListener('click', () => {
    if (isDerbyPitching) return;
    isDerbyPitching = true;
    arcadePitchBtn.disabled = true;
    arcadeSwingBtn.disabled = false;
    batter.state = 'idle';

    let pitchVy = 4.8;
    let pitchVx = 0;
    if (currentPitchType === 'changeup') {
      pitchVy = 3.6;
    } else if (currentPitchType === 'curve') {
      pitchVy = 4.2;
      pitchVx = -0.4;
    }

    ball = {
      x: 360,
      y: 235,
      r: 4,
      vx: pitchVx,
      vy: pitchVy,
      state: 'pitching'
    };
    announcerEl.textContent = `Here comes the ${currentPitchType}! Time your swing or press SPACE!`;
  });

  function performSwing() {
    if (!isDerbyPitching || ball.state !== 'pitching') return;
    arcadeSwingBtn.disabled = true;
    batter.state = 'swinging';

    const timingDelta = Math.abs(ball.y - 375);
    if (timingDelta < 32) {
      ball.state = 'hit';
      handleDerbyHit(timingDelta);
    } else {
      handleDerbyMiss();
    }
  }

  arcadeSwingBtn?.addEventListener('click', performSwing);
  window.addEventListener('keydown', (e) => {
    if (activeScreen === 'screen-derby') {
      if (e.code === 'Space' && !arcadeSwingBtn?.disabled) {
        e.preventDefault();
        performSwing();
      } else if (e.code === 'Enter' && !arcadePitchBtn?.disabled) {
        e.preventDefault();
        arcadePitchBtn.click();
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        openAdaptiveTimeout();
      }
    }
  });

  function handleDerbyHit(delta) {
    playBatCrack();
    let dist = 240;
    let hitTitle = 'Single';
    let pts = 50;

    if (hasPowerBat || delta < 10) {
      dist = Math.floor(395 + Math.random() * 60);
      hitTitle = hasPowerBat ? 'GRAND SLAM' : 'HOME RUN';
      pts = 200;
      hr++;
      ball.vy = -7.2;
      ball.vx = (Math.random() - 0.5) * 2;
      announcerEl.textContent = `CRACK! A towering ${dist} FT ${hitTitle} splashing right into the Ohio River!`;
      playCrowdCheer();
      speakAnnouncer(`GOODBYE BASEBALL! Hammered ${dist} feet into the Ohio River!`);
    } else {
      dist = Math.floor(250 + Math.random() * 50);
      hitTitle = delta < 20 ? 'Double' : 'Single';
      pts = 100;
      ball.vy = -4.5;
      ball.vx = (Math.random() > 0.5 ? 3 : -3);
      announcerEl.textContent = `Solid contact! Struck cleanly into the gap for a ${dist} FT ${hitTitle}!`;
      speakAnnouncer(`Hit into the gap for a ${hitTitle}!`);
    }

    hits++;
    if (dist > longestDist) longestDist = dist;
    addPoints(pts);
    hasPowerBat = false;
    if (powerActiveTag) powerActiveTag.classList.add('hidden');
    updateDerbyScore();

    setTimeout(() => {
      isDerbyPitching = false;
      arcadePitchBtn.disabled = false;
    }, 1600);
  }

  function handleDerbyMiss() {
    outs++;
    announcerEl.textContent = `Swing and a miss! Strike! (Outs: ${outs}/3)`;
    speakAnnouncer("Strike!");
    if (outs >= 3) {
      announcerEl.textContent = `Three outs! Side retired! Inning complete. Click Throw Pitch for next inning!`;
      speakAnnouncer("Three outs, side retired!");
      outs = 0;
    }
    updateDerbyScore();

    setTimeout(() => {
      isDerbyPitching = false;
      arcadePitchBtn.disabled = false;
      arcadeSwingBtn.disabled = true;
    }, 1200);
  }

  function updateDerbyScore() {
    const batsRuns = document.getElementById('hud-bats-runs');
    if (batsRuns) batsRuns.textContent = hr;

    const outsDots = document.getElementById('hud-outs-dots');
    if (outsDots) {
      outsDots.innerHTML = `
        <span class="hud-dot ${outs >= 1 ? 'on' : 'off'}"></span>
        <span class="hud-dot ${outs >= 2 ? 'on' : 'off'}"></span>
      `;
    }
  }

  // ============================================================
  // 5. DUGOUT ROSTER SELECT (MLB STATS API)
  // ============================================================
  let selectedKid = null;
  const rosterGrid = document.getElementById('dugout-roster-grid');

  async function loadDugoutRoster() {
    if (!rosterGrid) return;
    rosterGrid.innerHTML = '<p style="color:var(--text-muted);">Loading Louisville Bats Triple-A Roster from MLB Stats API...</p>';

    try {
      const res = await fetch('/api/bats/characters');
      const data = await res.json();
      const chars = data.characters || [];
      rosterGrid.innerHTML = '';

      chars.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = `kid-select-card ${i === 0 ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="kid-select-header">
            <span class="kid-select-name">#${c.jerseyNumber} ${c.fullName}</span>
            <span class="kid-select-pos">${c.primaryPosition}</span>
          </div>
          <div class="kid-quirk-box">
            Real MiLB Stats: <strong>${c.rawStats.battingAvg} AVG</strong> &bull; <strong>${c.rawStats.homeRuns} HR</strong> &bull; <strong>${c.rawStats.stolenBases} SB</strong>
          </div>
          <div class="stat-bars-grid">
            <span>Batting: <strong>${c.backyardStats.batting}/10</strong></span>
            <span>Speed: <strong>${c.backyardStats.running}/10</strong></span>
            <span>Pitching: <strong>${c.backyardStats.pitching}/10</strong></span>
            <span>Fielding: <strong>${c.backyardStats.fielding}/10</strong></span>
          </div>
        `;

        card.addEventListener('click', () => {
          document.querySelectorAll('.kid-select-card').forEach(k => k.classList.remove('selected'));
          card.classList.add('selected');
          selectedKid = c;
        });

        rosterGrid.appendChild(card);
      });

      selectedKid = chars[0];
    } catch (_) {
      rosterGrid.innerHTML = '<p>Loaded default sandlot slugger.</p>';
    }
  }

  document.getElementById('confirm-batter-btn')?.addEventListener('click', () => {
    if (selectedKid) {
      document.getElementById('current-batter-name').textContent = `${selectedKid.fullName.toUpperCase()} #${selectedKid.jerseyNumber}`;
      document.getElementById('hud-batter-display').textContent = `${selectedKid.fullName.toUpperCase()} - ${selectedKid.primaryPosition}`;
      document.getElementById('hud-avg').textContent = `${selectedKid.rawStats.battingAvg} AVG`;
      speakAnnouncer(`Now batting for the Louisville Bats: ${selectedKid.fullName}!`);
    }
    switchScreen('screen-derby');
  });

  // ============================================================
  // 6. PRE-K COLORING DUGOUT
  // ============================================================
  const colorCanvas = document.getElementById('coloring-canvas');
  const cctx = colorCanvas?.getContext('2d');
  let currentPrekMode = 'brush';
  let currentPrekColor = '#BA0C2F';
  let currentPrekTemplate = 'buddy';
  let isPrekDrawing = false;

  document.getElementById('prek-draw-btn')?.addEventListener('click', () => {
    currentPrekMode = 'brush';
    document.getElementById('prek-draw-btn').classList.add('active');
    document.getElementById('prek-fill-btn').classList.remove('active');
  });

  document.getElementById('prek-fill-btn')?.addEventListener('click', () => {
    currentPrekMode = 'fill';
    document.getElementById('prek-fill-btn').classList.add('active');
    document.getElementById('prek-draw-btn').classList.remove('active');
  });

  document.querySelectorAll('.palette-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      currentPrekColor = sw.getAttribute('data-color');
    });
  });

  document.querySelectorAll('.tmpl-select-btn').forEach(tb => {
    tb.addEventListener('click', () => {
      document.querySelectorAll('.tmpl-select-btn').forEach(b => b.classList.remove('active'));
      tb.classList.add('active');
      currentPrekTemplate = tb.getAttribute('data-tmpl');
      redrawColoringTemplate();
    });
  });

  function redrawColoringTemplate() {
    if (!cctx) return;
    cctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
    cctx.fillStyle = '#FFFFFF';
    cctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    cctx.strokeStyle = '#0C2340';
    cctx.lineWidth = 4;
    cctx.lineCap = 'round';
    cctx.lineJoin = 'round';

    if (currentPrekTemplate === 'buddy') {
      cctx.font = 'bold 20px sans-serif';
      cctx.fillStyle = '#0C2340';
      cctx.textAlign = 'center';
      cctx.fillText('🦇 Buddy Bat with Louisville Slugger', 310, 36);

      // Ears
      cctx.beginPath();
      cctx.moveTo(270, 95);
      cctx.lineTo(250, 48);
      cctx.lineTo(290, 85);
      cctx.stroke();

      cctx.beginPath();
      cctx.moveTo(330, 95);
      cctx.lineTo(350, 48);
      cctx.lineTo(310, 85);
      cctx.stroke();

      // Head
      cctx.beginPath();
      cctx.arc(300, 130, 46, 0, Math.PI * 2);
      cctx.stroke();
      cctx.beginPath();
      cctx.arc(285, 125, 6, 0, Math.PI * 2);
      cctx.arc(315, 125, 6, 0, Math.PI * 2);
      cctx.fill();
      cctx.beginPath();
      cctx.arc(300, 145, 18, 0.1, Math.PI - 0.1);
      cctx.stroke();

      // Body & Wings
      cctx.beginPath();
      cctx.ellipse(300, 240, 52, 70, 0, 0, Math.PI * 2);
      cctx.stroke();

      cctx.beginPath();
      cctx.moveTo(250, 205);
      cctx.quadraticCurveTo(160, 150, 110, 220);
      cctx.quadraticCurveTo(150, 260, 200, 250);
      cctx.quadraticCurveTo(230, 280, 255, 260);
      cctx.stroke();

      cctx.beginPath();
      cctx.moveTo(348, 205);
      cctx.quadraticCurveTo(440, 150, 490, 220);
      cctx.quadraticCurveTo(450, 260, 400, 250);
      cctx.quadraticCurveTo(370, 280, 345, 260);
      cctx.stroke();

      // Bat
      cctx.beginPath();
      cctx.rect(340, 210, 180, 18);
      cctx.stroke();
    } else if (currentPrekTemplate === 'diamond') {
      cctx.font = 'bold 20px sans-serif';
      cctx.fillStyle = '#0C2340';
      cctx.textAlign = 'center';
      cctx.fillText('⚾ Ballpark Diamond & Home Plate', 310, 36);

      cctx.beginPath();
      cctx.moveTo(310, 90);
      cctx.lineTo(460, 220);
      cctx.lineTo(310, 360);
      cctx.lineTo(160, 220);
      cctx.closePath();
      cctx.stroke();

      cctx.beginPath();
      cctx.moveTo(310, 345);
      cctx.lineTo(330, 365);
      cctx.lineTo(330, 390);
      cctx.lineTo(290, 390);
      cctx.lineTo(290, 365);
      cctx.closePath();
      cctx.stroke();
    } else if (currentPrekTemplate === 'cap') {
      cctx.font = 'bold 20px sans-serif';
      cctx.fillStyle = '#0C2340';
      cctx.textAlign = 'center';
      cctx.fillText('🧢 Louisville Bats Mascot Cap', 310, 36);

      cctx.beginPath();
      cctx.arc(280, 210, 85, Math.PI, 0);
      cctx.stroke();
      cctx.beginPath();
      cctx.ellipse(325, 210, 120, 25, 0.1, 0, Math.PI);
      cctx.stroke();
    }
  }

  function getPrekPos(e) {
    const rect = colorCanvas.getBoundingClientRect();
    const scaleX = colorCanvas.width / rect.width;
    const scaleY = colorCanvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  colorCanvas?.addEventListener('mousedown', (e) => {
    const pos = getPrekPos(e);
    if (currentPrekMode === 'fill') {
      cctx.fillStyle = currentPrekColor;
      cctx.beginPath();
      cctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
      cctx.fill();
      playCelebrationChime();
      return;
    }
    isPrekDrawing = true;
    cctx.beginPath();
    cctx.moveTo(pos.x, pos.y);
  });

  colorCanvas?.addEventListener('mousemove', (e) => {
    if (!isPrekDrawing || currentPrekMode !== 'brush') return;
    const pos = getPrekPos(e);
    cctx.strokeStyle = currentPrekColor;
    cctx.lineWidth = 14;
    cctx.lineTo(pos.x, pos.y);
    cctx.stroke();
  });

  window.addEventListener('mouseup', () => { isPrekDrawing = false; });

  document.getElementById('clear-prek-canvas')?.addEventListener('click', redrawColoringTemplate);
  document.getElementById('save-prek-canvas')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'buddy-bat-drawing.png';
    link.href = colorCanvas.toDataURL('image/png');
    link.click();
    addPoints(25);
    speakAnnouncer("Art saved! Twenty-five points awarded!");
  });

  // Tap-to-count balls
  let prekCount = 0;
  document.querySelectorAll('.tap-ball-item').forEach(b => {
    b.addEventListener('click', () => {
      if (b.classList.contains('counted')) return;
      b.classList.add('counted');
      prekCount++;
      document.getElementById('balls-counted-lbl').textContent = `${prekCount} / 5`;
      playCelebrationChime();
      speakAnnouncer(`${prekCount}!`);

      if (prekCount === 5) {
        addPoints(25);
        speakAnnouncer("Five baseballs counted! Awesome job!");
        setTimeout(() => {
          document.querySelectorAll('.tap-ball-item').forEach(item => item.classList.remove('counted'));
          prekCount = 0;
          document.getElementById('balls-counted-lbl').textContent = '0 / 5';
        }, 3000);
      }
    });
  });

  // Shape match
  document.querySelectorAll('.shape-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fb = document.getElementById('shape-pick-fb');
      fb.classList.remove('hidden');
      if (btn.getAttribute('data-correct') === 'true') {
        fb.className = 'shape-pick-fb correct';
        fb.textContent = '🌟 Correct! Home plate has 5 sides (Pentagon)! +25 Pts!';
        addPoints(25);
        speakAnnouncer("Correct! Home plate is a five-sided pentagon!");
      } else {
        fb.className = 'shape-pick-fb incorrect';
        fb.textContent = 'Count the sides of home plate: 5 sides = Pentagon!';
      }
    });
  });

  // ============================================================
  // 7. FRONT OFFICE SABERMETRICS SIMULATOR
  // ============================================================
  document.getElementById('calc-saber-pyth')?.addEventListener('click', () => {
    const rs = parseFloat(document.getElementById('saber-rs').value) || 680;
    const ra = parseFloat(document.getElementById('saber-ra').value) || 610;
    const gamma = 1.83;
    const winPct = Math.pow(rs, gamma) / (Math.pow(rs, gamma) + Math.pow(ra, gamma));
    const wins = Math.round(winPct * 162);
    document.getElementById('saber-pyth-res').innerHTML = `Simulated Record: <strong>.${Math.round(winPct * 1000)} (${wins} Wins - ${162 - wins} Losses)</strong>`;
    addPoints(20);
    speakAnnouncer(`Simulated record: ${wins} wins and ${162 - wins} losses.`);
  });

  const re24Lookup = {
    '0': { empty: '0.48', first: '0.86', scoring: '1.92', loaded: '2.28' },
    '1': { empty: '0.25', first: '0.51', scoring: '1.37', loaded: '1.54' },
    '2': { empty: '0.10', first: '0.22', scoring: '0.57', loaded: '0.74' }
  };

  function updateSaberRE24() {
    const outs = document.getElementById('saber-outs').value;
    const bases = document.getElementById('saber-bases').value;
    const val = re24Lookup[outs][bases] || '0.50';
    document.getElementById('saber-re24-res').innerHTML = `Expected Runs to End of Inning: <strong>${val} Runs</strong>`;
  }
  document.getElementById('saber-outs')?.addEventListener('change', updateSaberRE24);
  document.getElementById('saber-bases')?.addEventListener('change', updateSaberRE24);

  // Initialize
  renderDerbyField();
});
