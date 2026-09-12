// Batyard Slugger — Main Client Controller & Audio Engine

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 1. PERSISTENT POINTS & LEVEL PROGRESSION (Fixes Reset Bug!)
  // ============================================================
  let globalPoints = parseInt(localStorage.getItem('batyard_slugger_points') || '0', 10);
  let soundEnabled = localStorage.getItem('batyard_sound_enabled') !== 'false';

  const globalPointsEl = document.getElementById('global-points');
  const rankIconEl = document.getElementById('rank-icon');
  const rankTitleEl = document.getElementById('rank-title');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const organChargeBtn = document.getElementById('organ-charge-btn');

  function updateRankBadge() {
    let rank = 'T-Ball Rookie';
    let icon = '🥉';

    if (globalPoints >= 1000) {
      rank = 'Front Office GM';
      icon = '👑';
    } else if (globalPoints >= 500) {
      rank = 'Triple-A Bats Pro';
      icon = '🦇';
    } else if (globalPoints >= 250) {
      rank = 'Little League All-Star';
      icon = '🥇';
    } else if (globalPoints >= 100) {
      rank = 'Sandlot Slugger';
      icon = '🥈';
    }

    if (rankTitleEl) rankTitleEl.textContent = rank;
    if (rankIconEl) rankIconEl.textContent = icon;
    updateTrophyCase();
  }

  function addPoints(pts) {
    globalPoints += pts;
    localStorage.setItem('batyard_slugger_points', globalPoints.toString());
    if (globalPointsEl) globalPointsEl.textContent = globalPoints;
    updateRankBadge();
    playCelebrationChime();
  }

  if (globalPointsEl) globalPointsEl.textContent = globalPoints;
  updateRankBadge();

  // ============================================================
  // 2. BALLPARK ORGAN & SOUND EFFECTS (Web Audio API Synthesizer)
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

  // Play Ballpark Organ "Charge!" Fanfare (G4 - C5 - E5 - G5 - E5 - G5 ... CHARGE!)
  function playBallparkOrganCharge() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Frequencies: G4, C5, E5, G5, E5, G5
    const notes = [
      { f: 392.00, d: 0.16 }, // G4
      { f: 523.25, d: 0.16 }, // C5
      { f: 659.25, d: 0.16 }, // E5
      { f: 783.99, d: 0.32 }, // G5 (hold)
      { f: 659.25, d: 0.16 }, // E5
      { f: 783.99, d: 0.65 }  // G5 (triumphant sustain)
    ];

    let start = ctx.currentTime + 0.05;
    notes.forEach(note => {
      // Hammond Drawbar Organ synthesis (Fundamental + 2nd & 3rd harmonics + vibrato)
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

  // Realistic Bat Crack Sound Effect
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

  // Celebratory Ding / Bell Chime
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

  // Crowd Cheering Noise
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

  // Web Speech API Voice Announcer (Zero latency on mobile & desktop!)
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

  // Header sound controls
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('batyard_sound_enabled', soundEnabled.toString());
      soundToggleBtn.innerHTML = soundEnabled ? '🔊 <span>Sound: ON</span>' : '🔇 <span>Sound: MUTED</span>';
    });
    soundToggleBtn.innerHTML = soundEnabled ? '🔊 <span>Sound: ON</span>' : '🔇 <span>Sound: MUTED</span>';
  }

  if (organChargeBtn) {
    organChargeBtn.addEventListener('click', playBallparkOrganCharge);
  }

  // ============================================================
  // 3. TAB NAVIGATION (Preserving Points & State)
  // ============================================================
  const plankBtns = document.querySelectorAll('.plank-btn');
  const levelSections = document.querySelectorAll('.level-section');

  plankBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      plankBtns.forEach(b => b.classList.remove('active'));
      levelSections.forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetSec = document.getElementById(targetId);
      if (targetSec) targetSec.classList.add('active');

      if (targetId === 'tab-prek') redrawColoringTemplate();
      if (targetId === 'tab-roster') loadBatsRoster();
      if (targetId === 'tab-trophy') updateTrophyCase();
    });
  });

  // ============================================================
  // 4. LEVEL 1: PRE-K COLORING DUGOUT & TACTILE ELC PUZZLES
  // ============================================================
  const colorCanvas = document.getElementById('coloring-canvas');
  const cctx = colorCanvas.getContext('2d');
  let isDrawing = false;
  let currentColor = '#BA0C2F';
  let currentBrushSize = 14;
  let currentTemplate = 'buddy';
  let currentMode = 'brush'; // 'brush' or 'fill'

  // Tool Mode Buttons
  const drawModeBtn = document.getElementById('draw-mode-btn');
  const fillModeBtn = document.getElementById('fill-mode-btn');

  if (drawModeBtn && fillModeBtn) {
    drawModeBtn.addEventListener('click', () => {
      currentMode = 'brush';
      drawModeBtn.classList.add('active');
      fillModeBtn.classList.remove('active');
    });
    fillModeBtn.addEventListener('click', () => {
      currentMode = 'fill';
      fillModeBtn.classList.add('active');
      drawModeBtn.classList.remove('active');
    });
  }

  // Palette & Brush Buttons
  document.querySelectorAll('.crayon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.crayon-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.getAttribute('data-color');
    });
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBrushSize = parseInt(btn.getAttribute('data-size'), 10);
    });
  });

  document.querySelectorAll('.tmpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTemplate = btn.getAttribute('data-tmpl');
      redrawColoringTemplate();
    });
  });

  // Fixed Non-Overlapping Coloring Outlines (Resolves CSS/Drawing Overlap Bug!)
  function redrawColoringTemplate() {
    cctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
    cctx.fillStyle = '#FFFFFF';
    cctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    cctx.strokeStyle = '#0C2340';
    cctx.lineWidth = 4;
    cctx.fillStyle = '#0C2340';
    cctx.lineCap = 'round';
    cctx.lineJoin = 'round';

    if (currentTemplate === 'buddy') {
      // 1. Title Banner
      cctx.font = 'bold 22px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('🦇 Buddy Bat with Louisville Slugger', 310, 36);

      // 2. Ears (Left & Right - Drawn cleanly above head)
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

      // 3. Head (Clear Circle)
      cctx.beginPath();
      cctx.arc(300, 130, 46, 0, Math.PI * 2);
      cctx.stroke();

      // Eyes & Big Friendly Smile
      cctx.beginPath();
      cctx.arc(285, 125, 6, 0, Math.PI * 2);
      cctx.arc(315, 125, 6, 0, Math.PI * 2);
      cctx.fill();

      cctx.beginPath();
      cctx.arc(300, 145, 18, 0.1, Math.PI - 0.1);
      cctx.stroke();

      // 4. Body Oval
      cctx.beginPath();
      cctx.ellipse(300, 240, 52, 70, 0, 0, Math.PI * 2);
      cctx.stroke();

      // 5. Clean Non-overlapping Wings
      // Left Wing
      cctx.beginPath();
      cctx.moveTo(250, 205);
      cctx.quadraticCurveTo(160, 150, 110, 220);
      cctx.quadraticCurveTo(150, 260, 200, 250);
      cctx.quadraticCurveTo(230, 280, 255, 260);
      cctx.stroke();

      // Right Wing
      cctx.beginPath();
      cctx.moveTo(348, 205);
      cctx.quadraticCurveTo(440, 150, 490, 220);
      cctx.quadraticCurveTo(450, 260, 400, 250);
      cctx.quadraticCurveTo(370, 280, 345, 260);
      cctx.stroke();

      // 6. Louisville Slugger Bat
      cctx.beginPath();
      cctx.rect(340, 210, 180, 18);
      cctx.stroke();
      cctx.font = 'bold 9px monospace';
      cctx.fillText('LOUISVILLE SLUGGER', 430, 223);

    } else if (currentTemplate === 'diamond') {
      cctx.font = 'bold 22px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('⚾ Ballpark Diamond & Home Plate', 310, 36);

      // Infield Diamond
      cctx.beginPath();
      cctx.moveTo(310, 90);  // 2nd Base
      cctx.lineTo(460, 220); // 1st Base
      cctx.lineTo(310, 360); // Home Plate
      cctx.lineTo(160, 220); // 3rd Base
      cctx.closePath();
      cctx.stroke();

      // Home Plate Pentagon (Clean polygon)
      cctx.beginPath();
      cctx.moveTo(310, 345);
      cctx.lineTo(330, 365);
      cctx.lineTo(330, 390);
      cctx.lineTo(290, 390);
      cctx.lineTo(290, 365);
      cctx.closePath();
      cctx.stroke();
      cctx.font = 'bold 12px sans-serif';
      cctx.fillText('5-SIDED PENTAGON', 310, 415);

      // Bases
      cctx.strokeRect(300, 80, 20, 20);
      cctx.strokeRect(450, 210, 20, 20);
      cctx.strokeRect(150, 210, 20, 20);

    } else if (currentTemplate === 'cap') {
      cctx.font = 'bold 22px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('🧢 Louisville Bats Mascot Cap', 310, 36);

      // Cap Dome
      cctx.beginPath();
      cctx.arc(280, 210, 85, Math.PI, 0);
      cctx.stroke();
      // Visor
      cctx.beginPath();
      cctx.ellipse(325, 210, 120, 25, 0.1, 0, Math.PI);
      cctx.stroke();
      cctx.font = '40px sans-serif';
      cctx.fillText('🦇', 280, 185);

      // Baseball
      cctx.beginPath();
      cctx.arc(430, 320, 50, 0, Math.PI * 2);
      cctx.stroke();
    }
  }

  // Mouse & Touch Drawing Handlers
  function getCanvasPos(e) {
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

  function startDraw(e) {
    const pos = getCanvasPos(e);
    if (currentMode === 'fill') {
      // Tap-to-Fill Mode: Draw a smooth, clean color circle zone
      cctx.fillStyle = currentColor;
      cctx.beginPath();
      cctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
      cctx.fill();
      playCelebrationChime();
      return;
    }

    isDrawing = true;
    cctx.beginPath();
    cctx.moveTo(pos.x, pos.y);
  }

  function drawMove(e) {
    if (!isDrawing || currentMode !== 'brush') return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    cctx.strokeStyle = currentColor;
    cctx.lineWidth = currentBrushSize;
    cctx.lineTo(pos.x, pos.y);
    cctx.stroke();
  }

  function stopDraw() { isDrawing = false; }

  colorCanvas.addEventListener('mousedown', startDraw);
  colorCanvas.addEventListener('mousemove', drawMove);
  window.addEventListener('mouseup', stopDraw);

  colorCanvas.addEventListener('touchstart', startDraw, { passive: false });
  colorCanvas.addEventListener('touchmove', drawMove, { passive: false });
  window.addEventListener('touchend', stopDraw);

  document.getElementById('clear-canvas-btn').addEventListener('click', redrawColoringTemplate);
  document.getElementById('download-art-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `buddy-bat-art.png`;
    link.href = colorCanvas.toDataURL('image/png');
    link.click();
    addPoints(25);
    speakAnnouncer("Artwork saved! Great coloring, slugger!");
  });

  // Tactile ELC Puzzle 1: Tap to Count Baseballs
  let countedBalls = 0;
  const countedTotalEl = document.getElementById('counted-total');
  const bucketCompleteMsg = document.getElementById('bucket-complete-msg');

  document.querySelectorAll('.tap-ball-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('counted')) return;
      btn.classList.add('counted');
      countedBalls++;
      countedTotalEl.textContent = `${countedBalls} / 5`;
      playCelebrationChime();
      speakAnnouncer(`${countedBalls}!`);

      if (countedBalls === 5) {
        bucketCompleteMsg.classList.remove('hidden');
        addPoints(25);
        speakAnnouncer("Five baseballs in the bucket! Incredible counting!");
        setTimeout(() => {
          // Reset counting puzzle for more plays
          document.querySelectorAll('.tap-ball-btn').forEach(b => b.classList.remove('counted'));
          countedBalls = 0;
          countedTotalEl.textContent = '0 / 5';
          bucketCompleteMsg.classList.add('hidden');
        }, 3500);
      }
    });
  });

  // Tactile ELC Puzzle 2: Pentagon Home Plate
  const shapeFeedback = document.getElementById('shape-feedback');
  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      shapeFeedback.classList.remove('hidden');
      if (btn.classList.contains('correct-shape')) {
        shapeFeedback.className = 'shape-feedback correct';
        shapeFeedback.innerHTML = '🌟 <strong>CORRECT! +25 Points!</strong> Home plate has 5 sides, making it a Pentagon!';
        addPoints(25);
        speakAnnouncer("That's right! Home plate is a five-sided pentagon!");
      } else {
        shapeFeedback.className = 'shape-feedback incorrect';
        shapeFeedback.innerHTML = 'Nice try! Count the sides of home plate: 1, 2, 3, 4, 5 sides = Pentagon!';
      }
    });
  });

  // Pre-K Quiz Engine (Guaranteed Non-Repeating!)
  let lastPrekId = '';
  async function loadPrekQuestion() {
    const qEl = document.getElementById('prek-question-text');
    const optsEl = document.getElementById('prek-options-grid');
    const fbEl = document.getElementById('prek-feedback');
    const stdEl = document.getElementById('prek-standard');
    fbEl.className = 'quiz-feedback hidden';
    optsEl.innerHTML = '';
    qEl.textContent = 'Buddy Bat is fetching a fresh question...';

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'pre-k', excludeId: lastPrekId })
      });
      const qData = await res.json();
      lastPrekId = qData.id || '';
      qEl.textContent = qData.q;
      stdEl.textContent = qData.standard || 'KY Early Childhood Standards';

      qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          fbEl.classList.remove('hidden');
          if (idx === qData.ans) {
            fbEl.className = 'quiz-feedback correct';
            fbEl.innerHTML = `🌟 <strong>CORRECT! +25 Points!</strong> ${qData.explanation}`;
            addPoints(25);
            speakAnnouncer("Correct! You're a superstar!");
          } else {
            fbEl.className = 'quiz-feedback incorrect';
            fbEl.innerHTML = `Keep trying! Answer: <strong>${qData.options[qData.ans]}</strong>.`;
          }
        });
        optsEl.appendChild(btn);
      });
    } catch (_) {
      qEl.textContent = "Count Buddy Bat's baseballs: ⚾ ⚾ ⚾. How many?";
    }
  }

  document.getElementById('next-prek-q').addEventListener('click', loadPrekQuestion);
  redrawColoringTemplate();
  loadPrekQuestion();

  // ============================================================
  // 5. LEVEL 2: 3RD–5TH GRADE BATYARD DERBY & ACTION PUZZLES
  // ============================================================
  const derbyCanvas = document.getElementById('derby-canvas');
  const dctx = derbyCanvas.getContext('2d');
  const pitchBtn = document.getElementById('derby-pitch-btn');
  const swingBtn = document.getElementById('derby-swing-btn');
  const powerBtn = document.getElementById('derby-power-btn');
  const timeoutBtn = document.getElementById('bb97-timeout-btn');
  const outsEl = document.getElementById('derby-outs');
  const hitsEl = document.getElementById('derby-hits');
  const hrEl = document.getElementById('derby-hr');
  const distEl = document.getElementById('derby-dist');
  const announcerEl = document.getElementById('derby-announcer');

  let outs = 0, hits = 0, hr = 0, longestDist = 0;
  let isDerbyPitching = false;
  let hasPowerBat = false;
  let ball = { x: 350, y: 160, r: 7, vx: 0, vy: 0, state: 'ready' };
  let batter = { x: 295, y: 365, state: 'idle' };

  function renderDerbyField() {
    dctx.clearRect(0, 0, derbyCanvas.width, derbyCanvas.height);

    // 1. SKY & BACKGROUND TREES (Backyard Baseball '97 style)
    const sky = dctx.createLinearGradient(0, 0, 0, 95);
    sky.addColorStop(0, '#3A86C8');
    sky.addColorStop(1, '#8ECAE6');
    dctx.fillStyle = sky;
    dctx.fillRect(0, 0, derbyCanvas.width, 95);

    // Fluffy Green Trees along fence
    dctx.fillStyle = '#2D6A4F';
    for (let tx = 10; tx < derbyCanvas.width; tx += 45) {
      dctx.beginPath();
      dctx.arc(tx, 74, 25, 0, Math.PI * 2);
      dctx.fill();
    }
    dctx.fillStyle = '#40916C';
    for (let tx = 32; tx < derbyCanvas.width; tx += 50) {
      dctx.beginPath();
      dctx.arc(tx, 78, 18, 0, Math.PI * 2);
      dctx.fill();
    }

    // Wooden Blue/Teal Outfield Fence (Backyard Baseball '97 style)
    dctx.fillStyle = '#1D3557';
    dctx.fillRect(0, 80, derbyCanvas.width, 24);
    dctx.fillStyle = '#457B9D';
    dctx.fillRect(0, 78, derbyCanvas.width, 4);

    // Center Outfield Scoreboard Screen
    dctx.fillStyle = '#0C2340';
    dctx.fillRect(285, 66, 130, 24);
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 1.5;
    dctx.strokeRect(285, 66, 130, 24);
    dctx.fillStyle = '#FFC72C';
    dctx.font = 'bold 9px monospace';
    dctx.textAlign = 'center';
    dctx.fillText('LOUISVILLE BATS', 350, 81);

    // 2. OUTFIELD & INFIELD GRASS
    dctx.fillStyle = '#386641';
    dctx.fillRect(0, 100, derbyCanvas.width, 320);

    // Cut lawn stripes
    dctx.fillStyle = '#407B4A';
    dctx.fillRect(0, 125, derbyCanvas.width, 20);
    dctx.fillRect(0, 165, derbyCanvas.width, 25);

    // 3. INFIELD DIRT DIAMOND
    dctx.fillStyle = '#DDA15E';
    dctx.beginPath();
    dctx.moveTo(350, 130); // 2nd base
    dctx.lineTo(580, 260); // 1st base
    dctx.lineTo(350, 410); // Home plate
    dctx.lineTo(120, 260); // 3rd base
    dctx.closePath();
    dctx.fill();

    // Infield grass cutout
    dctx.fillStyle = '#386641';
    dctx.beginPath();
    dctx.moveTo(350, 165);
    dctx.lineTo(510, 260);
    dctx.lineTo(350, 355);
    dctx.lineTo(190, 260);
    dctx.closePath();
    dctx.fill();

    // 4. CHALK FOUL LINES & BATTER'S BOXES
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 3.5;
    // 3rd base line
    dctx.beginPath();
    dctx.moveTo(350, 380);
    dctx.lineTo(70, 220);
    dctx.stroke();
    // 1st base line
    dctx.beginPath();
    dctx.moveTo(350, 380);
    dctx.lineTo(630, 220);
    dctx.stroke();

    // Home Plate Pentagon
    dctx.fillStyle = '#FFFFFF';
    dctx.beginPath();
    dctx.moveTo(350, 370);
    dctx.lineTo(365, 385);
    dctx.lineTo(365, 400);
    dctx.lineTo(335, 400);
    dctx.lineTo(335, 385);
    dctx.closePath();
    dctx.fill();

    // Left & Right Chalk Batter's Boxes
    dctx.strokeStyle = '#FFFFFF';
    dctx.lineWidth = 2.5;
    dctx.strokeRect(275, 355, 50, 58); // Left box (Pablo Sanchez stance)
    dctx.strokeRect(375, 355, 50, 58); // Right box

    // 5. BASES & PITCHER MOUND
    dctx.fillStyle = '#BC6C25';
    dctx.beginPath();
    dctx.ellipse(350, 225, 42, 20, 0, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(340, 222, 20, 4); // rubber

    drawDerbyBase(350, 140); // 2nd
    drawDerbyBase(530, 250); // 1st
    drawDerbyBase(170, 250); // 3rd

    // 6. BACKYARD FIELDERS (Chibi kids)
    drawFielderKid(230, 175, '#BA0C2F');
    drawFielderKid(470, 175, '#BA0C2F');
    drawFielderKid(180, 235, '#0C2340');
    drawFielderKid(520, 235, '#0C2340');

    // 7. PITCHER ON THE MOUND
    drawPitcherKid(350, 210);

    // 8. BATTER (PABLO SANCHEZ / KID SLUGGER STYLE)
    drawBackyardBatter(295, 365);

    // 9. TOP-LEFT MINI-RADAR DIAMOND (Backyard Baseball '97)
    drawMiniRadar(18, 12);

    // 10. TOP-RIGHT "ON THE MOUND" HUD CARD
    drawMoundHUD(515, 10);

    // Power bat active banner
    if (hasPowerBat) {
      dctx.fillStyle = '#FFC72C';
      dctx.font = 'bold 12px sans-serif';
      dctx.textAlign = 'center';
      dctx.fillText('⚡ 3X ALUMINUM POWER BAT ENGAGED! ⚡', 350, 410);
    }

    // Ball
    if (ball.state !== 'ready') {
      dctx.save();
      if (hasPowerBat && ball.state === 'hit') {
        dctx.shadowColor = '#FFC72C';
        dctx.shadowBlur = 16;
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

  function drawDerbyBase(x, y) {
    dctx.save();
    dctx.translate(x, y);
    dctx.rotate(Math.PI / 4);
    dctx.fillStyle = '#FFFFFF';
    dctx.fillRect(-6, -6, 12, 12);
    dctx.restore();
  }

  function drawFielderKid(x, y, capColor) {
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

  function drawPitcherKid(x, y) {
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

  function drawBackyardBatter(x, y) {
    dctx.save();
    // Backwards Blue Cap
    dctx.fillStyle = '#2563EB';
    dctx.beginPath();
    dctx.arc(x, y - 20, 18, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#1D4ED8';
    dctx.beginPath();
    dctx.ellipse(x - 14, y - 24, 10, 4, -0.4, 0, Math.PI * 2);
    dctx.fill();

    // Round Face
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

    // Blue Jersey
    dctx.fillStyle = '#3B82F6';
    dctx.beginPath();
    dctx.arc(x - 2, y + 10, 14, 0, Math.PI * 2);
    dctx.fill();

    // Belly button
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

    // Wood Bat
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

  function updateDerby() {
    if (ball.state === 'pitching') {
      ball.y += ball.vy;
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

    renderDerbyField();
    requestAnimationFrame(updateDerby);
  }
  requestAnimationFrame(updateDerby);

  pitchBtn.addEventListener('click', () => {
    if (isDerbyPitching) return;
    isDerbyPitching = true;
    pitchBtn.disabled = true;
    swingBtn.disabled = false;
    batter.state = 'idle';

    ball = {
      x: 350,
      y: 235,
      r: 4,
      vx: 0,
      vy: 4.6,
      state: 'pitching'
    };
    announcerEl.textContent = "Here comes the pitch! Time your swing or press Spacebar!";
  });

  function performDerbySwing() {
    if (!isDerbyPitching || ball.state !== 'pitching') return;
    swingBtn.disabled = true;
    batter.state = 'swinging';

    const timingDelta = Math.abs(ball.y - 375);
    if (timingDelta < 32) {
      ball.state = 'hit';
      handleDerbyHit(timingDelta);
    } else {
      handleDerbyMiss();
    }
  }

  swingBtn.addEventListener('click', performDerbySwing);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !swingBtn.disabled) {
      e.preventDefault();
      performDerbySwing();
    }
  });

  function handleDerbyHit(delta) {
    playBatCrack();
    let dist = 240;
    let hitTitle = 'Single';
    let pts = 50;

    if (hasPowerBat || delta < 10) {
      dist = Math.floor(390 + Math.random() * 65);
      hitTitle = hasPowerBat ? 'GRAND SLAM' : 'HOME RUN';
      pts = 200;
      hr++;
      ball.vy = -7.2;
      ball.vx = (Math.random() - 0.5) * 2;
      announcerEl.textContent = `CRACK! A towering ${dist} FT ${hitTitle} splashing right into the Ohio River!`;
      playCrowdCheer();
      speakAnnouncer(`GOODBYE BASEBALL! A ${dist} foot home run into the Ohio River!`);
    } else {
      dist = Math.floor(250 + Math.random() * 50);
      hitTitle = delta < 20 ? 'Double' : 'Single';
      pts = 100;
      ball.vy = -4.5;
      ball.vx = (Math.random() > 0.5 ? 3 : -3);
      announcerEl.textContent = `Solid contact! Struck cleanly into the gap for a ${dist} FT ${hitTitle}!`;
      speakAnnouncer(`Hit well into the gap for a ${hitTitle}!`);
    }

    hits++;
    if (dist > longestDist) longestDist = dist;
    addPoints(pts);
    hasPowerBat = false;
    updateDerbyScore();

    setTimeout(() => {
      isDerbyPitching = false;
      pitchBtn.disabled = false;
    }, 1600);
  }

  function handleDerbyMiss() {
    outs++;
    announcerEl.textContent = `Swing and a miss! Strike! (Outs: ${outs}/3)`;
    speakAnnouncer("Strike!");
    if (outs >= 3) {
      announcerEl.textContent = `Three outs! Side retired! Inning complete. Click Throw Pitch for the next inning!`;
      speakAnnouncer("Three outs, side retired!");
      outs = 0;
    }
    updateDerbyScore();

    setTimeout(() => {
      isDerbyPitching = false;
      pitchBtn.disabled = false;
      swingBtn.disabled = true;
    }, 1200);
  }

  function updateDerbyScore() {
    outsEl.textContent = `${outs} / 3`;
    hitsEl.textContent = hits;
    hrEl.textContent = hr;
    distEl.textContent = `${longestDist} FT`;

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

  // Interactive Action Puzzle 1: Batting Average Dial
  const avgSlider = document.getElementById('avg-slider');
  const gaugeReadout = document.getElementById('gauge-readout');
  const lockAvgBtn = document.getElementById('lock-avg-btn');
  const avgDialFb = document.getElementById('avg-dial-feedback');

  if (avgSlider && gaugeReadout) {
    avgSlider.addEventListener('input', () => {
      const val = (parseInt(avgSlider.value, 10) / 1000).toFixed(3);
      gaugeReadout.textContent = `.${val.split('.')[1]}`;
    });

    lockAvgBtn.addEventListener('click', () => {
      avgDialFb.classList.remove('hidden');
      const val = parseInt(avgSlider.value, 10);
      if (val === 300) {
        hasPowerBat = true;
        avgDialFb.className = 'edu-feedback correct';
        avgDialFb.innerHTML = '⚡ <strong>PERFECT LOCK! .300! +50 Points!</strong><br>3 hits ÷ 10 at-bats = .300 AVG! 3X Aluminum Power Bat Activated!';
        addPoints(50);
        playBallparkOrganCharge();
        speakAnnouncer(".300 batting average locked! Power Bat Activated!");
      } else {
        avgDialFb.className = 'edu-feedback incorrect';
        avgDialFb.innerHTML = `You locked in .${val}. 3 hits in 10 at-bats is 3 ÷ 10 = .300. Slide to .300 and try again!`;
      }
    });
  }

  // Interactive Action Puzzle 2: Launch Angle & Forces
  const angleSlider = document.getElementById('angle-slider');
  const angleVal = document.getElementById('angle-val');
  const testLaunchBtn = document.getElementById('test-launch-btn');
  const physicsFb = document.getElementById('physics-feedback');

  if (angleSlider && angleVal) {
    angleSlider.addEventListener('input', () => {
      angleVal.innerHTML = `${angleSlider.value}&deg;`;
    });

    testLaunchBtn.addEventListener('click', () => {
      physicsFb.classList.remove('hidden');
      const ang = parseInt(angleSlider.value, 10);
      if (ang >= 25 && ang <= 32) {
        hasPowerBat = true;
        physicsFb.className = 'edu-feedback correct';
        physicsFb.innerHTML = `🚀 <strong>IDEAL LAUNCH ANGLE (${ang}&deg;)! +50 Points!</strong><br>Statcast optimal sweet spot ($25^\circ-32^\circ$) overcomes gravity! Power bat supercharged!`;
        addPoints(50);
        speakAnnouncer("Sweet spot launch angle achieved! Power bat ready!");
      } else if (ang < 25) {
        physicsFb.className = 'edu-feedback incorrect';
        physicsFb.innerHTML = `${ang}&deg; is too low! That will be a sharp ground ball. Aim between 25&deg; and 32&deg; to clear the wall!`;
      } else {
        physicsFb.className = 'edu-feedback incorrect';
        physicsFb.innerHTML = `${ang}&deg; is too steep! That will produce a high infield pop-up. Aim between 25&deg; and 32&deg;!`;
      }
    });
  }

  // Time Out & Power Up Button Handlers
  if (timeoutBtn) {
    timeoutBtn.addEventListener('click', () => {
      document.querySelector('.puzzle-action-card')?.scrollIntoView({ behavior: 'smooth' });
      speakAnnouncer("Time out called! Solve the puzzle to supercharge your bat!");
    });
  }
  if (powerBtn) {
    powerBtn.addEventListener('click', () => {
      document.querySelector('.puzzle-action-card')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 3rd-5th Grade Quiz Question Bank (Non-repeating)
  let lastElemId = '';
  async function loadElemQuestion() {
    const qEl = document.getElementById('elem-q-text');
    const optsEl = document.getElementById('elem-opts-container');
    const fbEl = document.getElementById('elem-feedback');
    fbEl.className = 'edu-feedback hidden';
    optsEl.innerHTML = '';
    qEl.textContent = 'Loading Kentucky standard challenge...';

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'grades-3-5', excludeId: lastElemId })
      });
      const qData = await res.json();
      lastElemId = qData.id || '';
      qEl.textContent = qData.q;

      qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'edu-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          fbEl.classList.remove('hidden');
          if (idx === qData.ans) {
            hasPowerBat = true;
            fbEl.className = 'edu-feedback correct';
            fbEl.innerHTML = `⚡ <strong>CORRECT! +50 Points! 3X Power Bat Activated!</strong><br>${qData.explanation}`;
            announcerEl.textContent = `⚡ Math/Science Power-Up Activated! Next hit is supercharged!`;
            addPoints(50);
            speakAnnouncer("Correct answer! 3X Power Bat activated!");
          } else {
            fbEl.className = 'edu-feedback incorrect';
            fbEl.innerHTML = `Nice effort! Standard explanation: ${qData.explanation}`;
          }
        });
        optsEl.appendChild(btn);
      });
    } catch (_) {
      qEl.textContent = "What is 3 hits in 10 at-bats expressed as a decimal? (.300)";
    }
  }

  document.getElementById('next-elem-q').addEventListener('click', loadElemQuestion);
  loadElemQuestion();

  // ============================================================
  // 6. LEVEL 3: POST-SECONDARY SABERMETRICS
  // ============================================================
  document.getElementById('calc-pyth-btn').addEventListener('click', () => {
    const rs = parseFloat(document.getElementById('pyth-rs').value) || 680;
    const ra = parseFloat(document.getElementById('pyth-ra').value) || 610;
    const gamma = 1.83;
    const winPct = Math.pow(rs, gamma) / (Math.pow(rs, gamma) + Math.pow(ra, gamma));
    const wins162 = Math.round(winPct * 162);
    document.getElementById('pyth-result').innerHTML = `Expected Win%: <strong>.${Math.round(winPct * 1000)} (${wins162} Wins / 162 G)</strong> &bull; Run Diff: +${Math.round(rs - ra)}`;
    addPoints(20);
    speakAnnouncer(`Expected true-talent win percentage: .${Math.round(winPct * 1000)}`);
  });

  document.getElementById('calc-woba-btn').addEventListener('click', () => {
    const b1 = parseFloat(document.getElementById('woba-1b').value) || 0;
    const b2 = parseFloat(document.getElementById('woba-2b').value) || 0;
    const b3 = parseFloat(document.getElementById('woba-3b').value) || 0;
    const hr = parseFloat(document.getElementById('woba-hr').value) || 0;
    const bb = parseFloat(document.getElementById('woba-bb').value) || 0;
    const ab = parseFloat(document.getElementById('woba-ab').value) || 450;

    const num = (0.89 * b1) + (1.27 * b2) + (1.62 * b3) + (2.10 * hr) + (0.69 * bb);
    const denom = ab + bb;
    const woba = num / denom;

    let tier = 'Average';
    if (woba >= .370) tier = 'Great (All-Star)';
    else if (woba >= .340) tier = 'Above Average';
    else if (woba < .300) tier = 'Below Average';

    document.getElementById('woba-result').innerHTML = `Calculated wOBA: <strong>.${Math.round(woba * 1000)} (${tier})</strong>`;
    addPoints(20);
  });

  // 24 Base-Out State RE24 Matrix
  const re24Matrix = {
    '0': { empty: '0.48', first: '0.86', scoring: '1.92', loaded: '2.28' },
    '1': { empty: '0.25', first: '0.51', scoring: '1.37', loaded: '1.54' },
    '2': { empty: '0.10', first: '0.22', scoring: '0.57', loaded: '0.74' }
  };

  function updateRE24() {
    const outsVal = document.getElementById('re24-outs').value;
    const basesVal = document.getElementById('re24-bases').value;
    const expRuns = re24Matrix[outsVal][basesVal] || '0.50';
    document.getElementById('re24-output').innerHTML = `Expected Runs to End of Inning: <strong>${expRuns} Runs</strong> (Markov Probability State)`;
  }
  document.getElementById('re24-outs').addEventListener('change', updateRE24);
  document.getElementById('re24-bases').addEventListener('change', updateRE24);

  let lastPostsecId = '';
  async function loadPostsecQuestion() {
    const qEl = document.getElementById('postsec-q-text');
    const optsEl = document.getElementById('postsec-opts-container');
    const fbEl = document.getElementById('postsec-feedback');
    fbEl.className = 'edu-feedback hidden';
    optsEl.innerHTML = '';
    qEl.textContent = 'Fetching advanced sabermetric scenario...';

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'post-secondary', excludeId: lastPostsecId })
      });
      const qData = await res.json();
      lastPostsecId = qData.id || '';
      qEl.textContent = qData.q;

      qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'edu-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          fbEl.classList.remove('hidden');
          if (idx === qData.ans) {
            fbEl.className = 'edu-feedback correct';
            fbEl.innerHTML = `📊 <strong>CORRECT! +100 Points!</strong><br>${qData.explanation}`;
            addPoints(100);
            speakAnnouncer("Sabermetric analysis verified! Points awarded!");
          } else {
            fbEl.className = 'edu-feedback incorrect';
            fbEl.innerHTML = `Analysis: ${qData.explanation}`;
          }
        });
        optsEl.appendChild(btn);
      });
    } catch (_) {
      qEl.textContent = "What is the Pythagorean win expectation exponent? (1.83)";
    }
  }

  document.getElementById('next-postsec-q').addEventListener('click', loadPostsecQuestion);
  loadPostsecQuestion();

  // ============================================================
  // 7. TAB 4: TROPHY CASE & UNLOCKABLE CARDS
  // ============================================================
  function updateTrophyCase() {
    const badges = [
      { id: 'badge-rookie', pts: 25, title: 'T-Ball Rookie Badge' },
      { id: 'badge-derby', pts: 100, title: 'Sandlot Home Run Club' },
      { id: 'badge-splash', pts: 250, title: 'Ohio River Splash Hit' },
      { id: 'badge-pro', pts: 500, title: 'Official Louisville Bats Card' },
      { id: 'badge-gm', pts: 1000, title: 'Front Office GM Ring' }
    ];

    badges.forEach(b => {
      const el = document.getElementById(b.id);
      if (!el) return;
      if (globalPoints >= b.pts) {
        el.className = 'trophy-card unlocked';
        const tag = el.querySelector('.locked-tag') || el.querySelector('.unlocked-tag');
        if (tag) {
          tag.className = 'unlocked-tag';
          tag.textContent = 'UNLOCKED';
        }
      } else {
        el.className = 'trophy-card locked';
        const tag = el.querySelector('.locked-tag') || el.querySelector('.unlocked-tag');
        if (tag) {
          tag.className = 'locked-tag';
          tag.textContent = `${b.pts} PTS`;
        }
      }
    });
  }

  // ============================================================
  // 8. TAB 5: ROSTER GRID (MLB STATS API)
  // ============================================================
  async function loadBatsRoster() {
    const grid = document.getElementById('batyard-roster-grid');
    grid.innerHTML = '<p style="color: var(--text-muted);">Loading Louisville Bats Triple-A roster from MLB Stats API...</p>';

    try {
      const res = await fetch('/api/bats/characters');
      const data = await res.json();
      const chars = data.characters || [];
      grid.innerHTML = '';

      chars.forEach(p => {
        const card = document.createElement('div');
        card.className = 'backyard-kid-card';
        card.innerHTML = `
          <div class="kid-header">
            <span class="kid-name">#${p.jerseyNumber} ${p.fullName}</span>
            <span class="kid-pos">${p.primaryPosition} &bull; Triple-A</span>
          </div>
          <div class="kid-persona-box">
            Real MiLB Stats: <strong>${p.rawStats.battingAvg} AVG</strong> &bull; <strong>${p.rawStats.homeRuns} HR</strong> &bull; <strong>${p.rawStats.stolenBases} SB</strong>
          </div>
          <div style="font-size: 0.8rem; color: #CBD5E1; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px;">
            <span>Batting: <strong>${p.backyardStats.batting}/10</strong></span>
            <span>Speed: <strong>${p.backyardStats.running}/10</strong></span>
            <span>Pitching: <strong>${p.backyardStats.pitching}/10</strong></span>
            <span>Fielding: <strong>${p.backyardStats.fielding}/10</strong></span>
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (e) {
      grid.innerHTML = `<p style="color: var(--bats-red);">Error loading roster: ${e.message}</p>`;
    }
  }

  document.getElementById('refresh-roster-btn').addEventListener('click', loadBatsRoster);
});
