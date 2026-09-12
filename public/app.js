// Batyard Slugger — Video Game Controller & JCPS Adaptive Testing Engine

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 1. GAME STATE MACHINE & PERSISTENT POINTS
  // ============================================================
  let globalPoints = parseInt(localStorage.getItem('batyard_points') || '0', 10);
  let soundEnabled = localStorage.getItem('batyard_sound') !== 'false';
  let activeScreen = 'screen-title';
  const gradeStorageKey = 'batyard_grade_band';
  const gradeBands = {
    'prek-k': { tier: 1, label: 'PRE-K–K', help: 'Counting, shapes, and adding within 10.' },
    'grades-1-2': { tier: 2, label: 'GRADES 1–2', help: 'Addition, subtraction, and early multiplication.' },
    'grades-3-5': { tier: 3, label: 'GRADES 3–5', help: 'Fractions, decimals, batting averages, and total bases.' },
    'grades-6-8': { tier: 4, label: 'GRADES 6–8', help: 'Rates, percentages, ERA, and OPS.' },
    'grades-9-plus': { tier: 5, label: 'GRADES 9+', help: 'Multi-step sabermetrics and run expectancy.' }
  };
  let selectedGradeBand = localStorage.getItem(gradeStorageKey) || 'grades-3-5';
  if (!gradeBands[selectedGradeBand]) selectedGradeBand = 'grades-3-5';

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
        ensureBatter();
        if (attemptPhase === 'question') openAdaptiveTimeout();
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
  // 2. ELEVENLABS GAME SOUNDS & WEB AUDIO FALLBACK
  // ============================================================
  const generatedSfx = {
    organ: { src: 'assets/audio/ballpark-organ-charge.mp3', volume: 0.82 },
    batCrack: { src: 'assets/audio/bat-crack.mp3', volume: 0.92 },
    crowd: { src: 'assets/audio/crowd-home-run.mp3', volume: 0.78 },
    celebration: { src: 'assets/audio/power-up-chime.mp3', volume: 0.74 }
  };
  const activeSfx = new Set();

  function playGeneratedSfx(name, fallback) {
    const effect = generatedSfx[name];
    if (!effect || typeof Audio !== 'function') {
      fallback();
      return;
    }

    try {
      const audio = new Audio(effect.src);
      audio.preload = 'auto';
      audio.volume = effect.volume;
      activeSfx.add(audio);
      const cleanup = () => activeSfx.delete(audio);
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      const playback = audio.play();
      if (playback?.catch) playback.catch(() => {
        cleanup();
        fallback();
      });
    } catch {
      fallback();
    }
  }

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

  function synthesizeBallparkOrganCharge() {
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

  }

  function playBallparkOrganCharge() {
    if (!soundEnabled) return;
    playGeneratedSfx('organ', synthesizeBallparkOrganCharge);
    speakAnnouncer("CHARGE!");
  }

  function synthesizeBatCrack() {
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

  function playBatCrack() {
    if (!soundEnabled) return;
    playGeneratedSfx('batCrack', synthesizeBatCrack);
  }

  function synthesizeCelebrationChime() {
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

  function playCelebrationChime() {
    if (!soundEnabled) return;
    playGeneratedSfx('celebration', synthesizeCelebrationChime);
  }

  function synthesizeCrowdCheer() {
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

  function playCrowdCheer() {
    if (!soundEnabled) return;
    playGeneratedSfx('crowd', synthesizeCrowdCheer);
  }

  let announcerRequest = null;
  let announcerAudio = null;
  let announcerAudioUrl = null;
  let elevenLabsConfigured = false;

  // Learn the server capability before the player reaches the first at-bat.
  // When the paid voice is unavailable we speak synchronously inside the
  // user's tap/click, which mobile browsers are much less likely to block.
  fetch('/api/health')
    .then(response => response.ok ? response.json() : null)
    .then(health => {
      elevenLabsConfigured = health?.elevenLabsConfigured === true;
    })
    .catch(() => {
      elevenLabsConfigured = false;
    });

  function clearAnnouncerAudio() {
    if (announcerAudio) announcerAudio.pause();
    announcerAudio = null;
    if (announcerAudioUrl) URL.revokeObjectURL(announcerAudioUrl);
    announcerAudioUrl = null;
  }

  function stopAnnouncer() {
    if (announcerRequest) announcerRequest.abort();
    announcerRequest = null;
    clearAnnouncerAudio();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function speakWithBrowserVoice(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.pitch = 1.1;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  async function speakAnnouncer(text) {
    if (!soundEnabled) return;
    stopAnnouncer();

    if (!elevenLabsConfigured) {
      speakWithBrowserVoice(text);
      return;
    }

    const request = new AbortController();
    announcerRequest = request;

    try {
      const response = await fetch('/api/voice/announcer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: request.signal
      });
      if (!response.ok) throw new Error('Voice unavailable');

      const objectUrl = URL.createObjectURL(await response.blob());
      if (announcerRequest !== request || !soundEnabled) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const audio = new Audio(objectUrl);
      announcerAudio = audio;
      announcerAudioUrl = objectUrl;
      const cleanup = () => {
        if (announcerAudio === audio) clearAnnouncerAudio();
        else URL.revokeObjectURL(objectUrl);
      };
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      await audio.play();
    } catch (error) {
      if (error.name !== 'AbortError' && announcerRequest === request && soundEnabled) {
        clearAnnouncerAudio();
        speakWithBrowserVoice(text);
      }
    } finally {
      if (announcerRequest === request) announcerRequest = null;
    }
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (!soundEnabled) stopAnnouncer();
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
  let catTier = gradeBands[selectedGradeBand].tier;
  let catStreak = 0;
  let catLastResult = null;
  let catLastQId = '';
  let activeAdaptiveQuestion = null;
  let attemptPhase = 'question';
  let questionPending = false;
  let answerLocked = false;
  let derbyPaused = false;
  const questionSessionKey = 'batyard_answered_question_ids';
  const factTokenPrefix = 'fact:';
  let storedQuestionIds = [];
  try {
    storedQuestionIds = JSON.parse(window.sessionStorage?.getItem(questionSessionKey) || '[]');
  } catch (_) {}
  const storedQuestionTokens = Array.isArray(storedQuestionIds) ? storedQuestionIds : [];
  const answeredQuestionIds = new Set(storedQuestionTokens.filter(token => !String(token).startsWith(factTokenPrefix)));
  const answeredFactIds = new Set(storedQuestionTokens
    .filter(token => String(token).startsWith(factTokenPrefix))
    .map(token => String(token).slice(factTokenPrefix.length)));
  const recentQuestions = [];

  function rememberAnsweredQuestion(question) {
    if (!question?.id) return;
    answeredQuestionIds.add(question.id);
    if (question.factId) answeredFactIds.add(question.factId);
    recentQuestions.push(question.q);
    if (recentQuestions.length > 20) recentQuestions.shift();
    try {
      const sessionTokens = [...answeredQuestionIds, ...[...answeredFactIds].map(id => `${factTokenPrefix}${id}`)];
      window.sessionStorage?.setItem(questionSessionKey, JSON.stringify(sessionTokens));
    } catch (_) {}
  }

  const catTierBadge = document.getElementById('cat-tier-badge');
  const catStreakBadge = document.getElementById('cat-streak-badge');
  const catQText = document.getElementById('cat-question-text');
  const catOptsGrid = document.getElementById('cat-options-grid');
  const catFbBox = document.getElementById('cat-feedback-box');
  const adaptiveModal = document.getElementById('modal-adaptive-timeout');
  const returnToAtBatBtn = document.getElementById('return-to-atbat-btn');
  const closeTimeoutBtn = document.getElementById('close-timeout-btn');
  const powerActiveTag = document.getElementById('power-active-tag');
  const gradeBandHelp = document.getElementById('grade-band-help');
  const gradeBandButtons = [...document.querySelectorAll('.grade-band-btn')];

  function chooseGradeBand(band, persist = true) {
    const grade = gradeBands[band];
    if (!grade) return;
    selectedGradeBand = band;
    catTier = grade.tier;
    catStreak = 0;
    catLastResult = null;
    catLastQId = '';
    activeAdaptiveQuestion = null;
    attemptPhase = 'question';
    gradeBandButtons.forEach(button => {
      const selected = button.getAttribute('data-grade-band') === band;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (gradeBandHelp) gradeBandHelp.textContent = grade.help;
    if (catTierBadge) catTierBadge.textContent = grade.label;
    if (persist) localStorage.setItem(gradeStorageKey, band);
  }

  gradeBandButtons.forEach(button => {
    button.addEventListener('click', () => chooseGradeBand(button.getAttribute('data-grade-band')));
  });
  chooseGradeBand(selectedGradeBand, false);

  async function loadAdaptiveQuestion() {
    if (questionPending) return;
    questionPending = true;
    answerLocked = true;
    activeAdaptiveQuestion = null;
    catFbBox.className = 'chalk-feedback-box hidden';
    catOptsGrid.innerHTML = '';
    catQText.textContent = 'Buddy is picking your next question…';

    try {
      const res = await fetch('/api/quiz/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTier: catTier,
          gradeTier: gradeBands[selectedGradeBand].tier,
          streak: catStreak,
          lastResult: catLastResult,
          excludeId: catLastQId,
          recentIds: [...answeredQuestionIds],
          recentFactIds: [...answeredFactIds],
          recentQuestions
        })
      });

      if (!res.ok) throw new Error('Question request failed');
      activeAdaptiveQuestion = await res.json();
      if (!activeAdaptiveQuestion.q || !Array.isArray(activeAdaptiveQuestion.options) ||
          !Number.isInteger(activeAdaptiveQuestion.ans)) throw new Error('Invalid question');
      catLastQId = activeAdaptiveQuestion.id || '';
      catTier = activeAdaptiveQuestion.difficulty || catTier;

      if (catTierBadge) catTierBadge.textContent = gradeBands[selectedGradeBand].label;
      if (catStreakBadge) catStreakBadge.textContent = `🔥 STREAK: ${catStreak}`;
      catQText.textContent = activeAdaptiveQuestion.q;

    } catch (_) {
      // Keep the required question playable even without a network connection.
      const fallbackQuestions = [
        { id: 'offline-count', q: 'Buddy has 2 baseballs and finds 3 more. How many now?', options: ['4', '5', '6'], ans: 1, explanation: '2 + 3 = 5 baseballs.' },
        { id: 'offline-plate', q: 'How many sides does home plate have?', options: ['3', '4', '5'], ans: 2, explanation: 'Home plate is a pentagon with 5 sides.' }
      ];
      activeAdaptiveQuestion = fallbackQuestions.find(q => q.id !== catLastQId);
      catLastQId = activeAdaptiveQuestion.id;
      catQText.textContent = activeAdaptiveQuestion.q;
      catTierBadge.textContent = 'OFFLINE PRACTICE';
    } finally {
      questionPending = false;
      answerLocked = false;
    }
      activeAdaptiveQuestion.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'cat-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          handleAdaptiveAnswer(idx);
        });
        catOptsGrid.appendChild(btn);
      });
  }

  function handleAdaptiveAnswer(selectedIdx) {
    if (attemptPhase !== 'question' || questionPending || answerLocked || !activeAdaptiveQuestion) return;
    answerLocked = true;
    catOptsGrid.querySelectorAll('button').forEach(btn => { btn.disabled = true; });
    catFbBox.classList.remove('hidden');
    const isCorrect = selectedIdx === activeAdaptiveQuestion.ans;
    catLastResult = isCorrect;
    rememberAnsweredQuestion(activeAdaptiveQuestion);

    if (isCorrect) {
      catStreak++;
      hasPowerBat = true;
      if (powerActiveTag) powerActiveTag.classList.remove('hidden');
      const pts = 25 * catTier;
      addPoints(pts);

      catFbBox.className = 'chalk-feedback-box correct';
      catFbBox.textContent = `Correct! +${pts} points. ${activeAdaptiveQuestion.explanation} Your swing is ready!`;
      
      speakAnnouncer('Correct! Your power bat is ready. Batter up!');
      playBallparkOrganCharge();

      if (catStreakBadge) catStreakBadge.textContent = `🔥 STREAK: ${catStreak}`;
      attemptPhase = 'ready';
      adaptiveModal.classList.add('hidden');
      arcadePitchBtn.disabled = false;
      announcerEl.textContent = 'Correct! You earned one pitch. Choose a pitch, then throw and swing!';
    } else {
      catStreak = 0;
      recordStrike('Incorrect answer');
      catFbBox.className = 'chalk-feedback-box incorrect';
      catFbBox.textContent = `Strike! ${activeAdaptiveQuestion.explanation} Next question coming up…`;
      if (catStreakBadge) catStreakBadge.textContent = `🔥 STREAK: 0`;
      setTimeout(loadAdaptiveQuestion, 1800);
    }
  }

  function openAdaptiveTimeout() {
    if (attemptPhase !== 'question') return;
    if (adaptiveModal) adaptiveModal.classList.remove('hidden');
    arcadePitchBtn.disabled = true;
    arcadeSwingBtn.disabled = true;
    if (!activeAdaptiveQuestion && !questionPending) loadAdaptiveQuestion();
  }

  function closeAdaptiveTimeout() {
    if (adaptiveModal) adaptiveModal.classList.add('hidden');
    switchScreen('screen-title');
  }

  function toggleDerbyPause() {
    if (attemptPhase !== 'ready' && attemptPhase !== 'pitching') return;
    derbyPaused = !derbyPaused;
    arcadePitchBtn.disabled = derbyPaused || attemptPhase !== 'ready';
    arcadeSwingBtn.disabled = derbyPaused || attemptPhase !== 'pitching';
    document.getElementById('game-timeout-btn').textContent = derbyPaused ? '▶ RESUME' : '✋ TIME OUT';
    document.getElementById('bb97-hud-timeout-btn').textContent = derbyPaused ? '▶ RESUME' : '✋ TIME OUT';
  }
  document.getElementById('game-timeout-btn')?.addEventListener('click', toggleDerbyPause);
  document.getElementById('bb97-hud-timeout-btn')?.addEventListener('click', toggleDerbyPause);
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

  let strikes = 0, outs = 0, hits = 0, hr = 0, longestDist = 0;
  let isDerbyPitching = false;
  let hasPowerBat = false;
  let currentPitchType = 'fastball';
  let ball = { x: 360, y: 160, r: 7, vx: 0, vy: 0, state: 'ready' };
  let batter = { x: 300, y: 365, state: 'idle' };
  const characterAnimations = window.BatyardCharacterAnimations || {};
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  let characterIdleFrame = 0;
  let pitcherAnimationFrame = null;
  let runnerAnimation = null;
  let activePitcherKey = 'Slugger_Pitcher';
  const derbyBackgroundImage = typeof Image === 'function' ? new Image() : null;
  if (derbyBackgroundImage) {
    derbyBackgroundImage.src = 'assets/images/setting.png';
    derbyBackgroundImage.addEventListener('load', () => {
      if (activeScreen === 'screen-derby') renderDerbyField();
    }, { once: true });
  }

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
    drawDerbyBackground();

    // Keep only active game pieces over the localized Slugger Field artwork.
    drawFielder(220, 205, '#BA0C2F');
    drawFielder(500, 205, '#BA0C2F');
    drawFielder(130, 260, '#0C2340');
    drawFielder(590, 260, '#0C2340');

    // Pitcher — animated from the Slugger_Pitcher pose asset when available.
    drawPitcher(360, 250);

    // Batter (Pablo Sanchez / Kid Slugger)
    if (!runnerAnimation) drawBatter(batter.x, batter.y);
    drawHotRodsRunner();

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

  function drawDerbyBackground() {
    if (derbyBackgroundImage?.complete && derbyBackgroundImage.naturalWidth > 0) {
      const imageRatio = derbyBackgroundImage.naturalWidth / derbyBackgroundImage.naturalHeight;
      const canvasRatio = derbyCanvas.width / derbyCanvas.height;
      let sx = 0;
      let sy = 0;
      let sourceWidth = derbyBackgroundImage.naturalWidth;
      let sourceHeight = derbyBackgroundImage.naturalHeight;

      if (imageRatio < canvasRatio) {
        sourceHeight = sourceWidth / canvasRatio;
        sy = (derbyBackgroundImage.naturalHeight - sourceHeight) * 0.35;
      } else if (imageRatio > canvasRatio) {
        sourceWidth = sourceHeight * canvasRatio;
        sx = (derbyBackgroundImage.naturalWidth - sourceWidth) / 2;
      }

      dctx.imageSmoothingEnabled = true;
      dctx.imageSmoothingQuality = 'high';
      dctx.drawImage(
        derbyBackgroundImage,
        sx, sy, sourceWidth, sourceHeight,
        0, 0, derbyCanvas.width, derbyCanvas.height
      );
      return;
    }

    // Fast paint while the image decodes; the load handler redraws immediately.
    dctx.fillStyle = '#4F8F45';
    dctx.fillRect(0, 0, derbyCanvas.width, derbyCanvas.height);
  }

  function drawBackyardCloud(x, y, scale) {
    dctx.save();
    dctx.translate(x, y);
    dctx.scale(scale, scale);
    dctx.fillStyle = 'rgba(255, 247, 218, .72)';
    dctx.strokeStyle = 'rgba(110, 105, 89, .22)';
    dctx.lineWidth = 2;
    dctx.beginPath();
    dctx.moveTo(-28, 10);
    dctx.bezierCurveTo(-38, 1, -25, -8, -13, -4);
    dctx.bezierCurveTo(-6, -19, 16, -16, 18, -4);
    dctx.bezierCurveTo(35, -8, 42, 7, 29, 13);
    dctx.quadraticCurveTo(0, 17, -28, 10);
    dctx.closePath();
    dctx.fill();
    dctx.stroke();
    dctx.restore();
  }

  function drawLouisvilleSkyline() {
    dctx.save();

    // Soft back layer: irregular blocks make the skyline feel inked, not architectural.
    dctx.fillStyle = '#8B9E8D';
    [[8, 45, 35, 22], [48, 37, 29, 30], [82, 48, 42, 19], [237, 43, 31, 24], [274, 51, 38, 16]].forEach(([x, y, w, h]) => {
      dctx.fillRect(x, y, w, h);
    });

    dctx.fillStyle = '#405E5A';
    dctx.strokeStyle = '#294845';
    dctx.lineWidth = 2;

    // Downtown rooflines as seen over the outfield: Humana angles and the
    // instantly readable stepped/pyramid cap of the Old National tower.
    dctx.fillRect(92, 30, 33, 38);
    dctx.beginPath();
    dctx.moveTo(90, 30);
    dctx.lineTo(108, 18);
    dctx.lineTo(127, 30);
    dctx.closePath();
    dctx.fill();
    dctx.stroke();

    dctx.fillRect(137, 17, 39, 51);
    dctx.beginPath();
    dctx.moveTo(137, 17);
    dctx.lineTo(156, 7);
    dctx.lineTo(176, 17);
    dctx.closePath();
    dctx.fill();
    dctx.stroke();
    dctx.fillStyle = '#E8C780';
    dctx.fillRect(142, 23, 4, 5);
    dctx.fillRect(151, 23, 4, 5);
    dctx.fillRect(160, 23, 4, 5);
    dctx.fillRect(142, 34, 4, 5);
    dctx.fillRect(151, 34, 4, 5);
    dctx.fillRect(160, 34, 4, 5);

    dctx.fillStyle = '#4E6F68';
    dctx.beginPath();
    dctx.moveTo(184, 67);
    dctx.lineTo(184, 34);
    dctx.lineTo(196, 25);
    dctx.lineTo(217, 25);
    dctx.lineTo(229, 34);
    dctx.lineTo(229, 67);
    dctx.closePath();
    dctx.fill();
    dctx.stroke();

    // A tiny water-tower silhouette gives the scene a friendly sandlot scale.
    dctx.strokeStyle = '#35534F';
    dctx.lineWidth = 2;
    dctx.beginPath();
    dctx.moveTo(55, 52);
    dctx.lineTo(59, 67);
    dctx.moveTo(70, 52);
    dctx.lineTo(66, 67);
    dctx.stroke();
    dctx.fillStyle = '#4E6F68';
    dctx.beginPath();
    dctx.ellipse(62, 48, 12, 7, 0, 0, Math.PI * 2);
    dctx.fill();
    dctx.restore();
  }

  function drawOhioRiverBridges() {
    dctx.save();
    dctx.strokeStyle = '#355754';
    dctx.fillStyle = '#355754';
    dctx.lineCap = 'round';

    // The I-65/Kennedy bridge sightline, simplified into chunky comic-book trusses.
    dctx.fillRect(315, 57, 405, 5);
    dctx.lineWidth = 3;
    dctx.beginPath();
    dctx.moveTo(322, 56);
    for (let x = 322; x < 722; x += 48) {
      dctx.lineTo(x + 24, 35);
      dctx.lineTo(x + 48, 56);
    }
    dctx.stroke();
    dctx.lineWidth = 2;
    for (let x = 322; x <= 706; x += 48) {
      dctx.beginPath();
      dctx.moveTo(x, 56);
      dctx.lineTo(x, 65);
      dctx.stroke();
    }

    // Twin uprights echo the river bridges without competing with the scoreboard.
    for (const x of [333, 684]) {
      dctx.fillRect(x, 25, 6, 39);
      dctx.fillRect(x - 5, 23, 16, 5);
    }
    dctx.restore();
  }

  function drawSandlotTexture() {
    dctx.save();
    dctx.strokeStyle = 'rgba(229, 222, 143, .26)';
    dctx.lineWidth = 1.5;
    const grassTufts = [[35, 120], [78, 202], [112, 149], [158, 188], [224, 116], [276, 202], [449, 122], [503, 198], [578, 143], [650, 182], [697, 117]];
    for (const [x, y] of grassTufts) {
      dctx.beginPath();
      dctx.moveTo(x, y + 5);
      dctx.quadraticCurveTo(x - 3, y, x - 6, y - 2);
      dctx.moveTo(x, y + 5);
      dctx.quadraticCurveTo(x + 1, y - 1, x + 4, y - 4);
      dctx.moveTo(x, y + 5);
      dctx.quadraticCurveTo(x + 5, y + 1, x + 8, y + 1);
      dctx.stroke();
    }
    dctx.restore();
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
    const animation = characterAnimations[activePitcherKey] || characterAnimations.Slugger_Pitcher;
    if (animation) {
      const frame = pitcherAnimationFrame === null ? 0 : pitcherAnimationFrame;
      const pose = getCharacterPose(animation, frame);
      const idleBob = pitcherAnimationFrame === null && !prefersReducedMotion
        ? Math.sin(characterIdleFrame / 16) * 1.2
        : 0;
      const isHotRod = activePitcherKey === 'HotRods_Pitcher';
      const colors = isHotRod
        ? { cap: '#0C2340', jersey: '#BA0C2F', sleeves: '#F8FAFC', shorts: '#0C2340', skin: '#8D5524', shoes: '#FFC72C' }
        : { cap: '#BA0C2F', jersey: '#F8FAFC', sleeves: '#BA0C2F', shorts: '#0C2340', skin: '#C97C5D', shoes: '#FFC72C' };
      drawAnimatedKid(x, y + idleBob, 0.78, pose, colors, true);
      drawCharacterTag(isHotRod ? 'HOT ROD' : 'SLUGGER', x, y + 22, isHotRod ? '#0C2340' : '#BA0C2F');
      return;
    }

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

  function getCharacterPose(animation, frame) {
    const progress = ((frame % animation.durationFrames) + animation.durationFrames) % animation.durationFrames / animation.durationFrames;
    const poses = animation.poses;
    let from = poses[0], to = poses[poses.length - 1];
    for (let index = 1; index < poses.length; index++) {
      if (progress <= poses[index].at) {
        from = poses[index - 1];
        to = poses[index];
        break;
      }
    }
    const span = Math.max(0.001, to.at - from.at);
    const amount = (progress - from.at) / span;
    const pose = {};
    for (const key of ['armLeft', 'armRight', 'legLeft', 'legRight', 'lean', 'bob']) {
      pose[key] = from[key] + (to[key] - from[key]) * amount;
    }
    return pose;
  }

  function drawJointedLimb(startX, startY, firstLength, firstAngle, secondLength, secondAngle, color, width) {
    const jointX = startX + Math.sin(firstAngle) * firstLength;
    const jointY = startY + Math.cos(firstAngle) * firstLength;
    const endX = jointX + Math.sin(secondAngle) * secondLength;
    const endY = jointY + Math.cos(secondAngle) * secondLength;
    dctx.strokeStyle = color;
    dctx.lineWidth = width;
    dctx.lineCap = 'round';
    dctx.lineJoin = 'round';
    dctx.beginPath();
    dctx.moveTo(startX, startY);
    dctx.lineTo(jointX, jointY);
    dctx.lineTo(endX, endY);
    dctx.stroke();
    return { x: endX, y: endY };
  }

  function drawAnimatedKid(x, y, scale, pose, colors, hasGlove = false) {
    dctx.save();
    dctx.translate(x, y + pose.bob * scale);
    dctx.rotate(pose.lean);
    dctx.scale(scale, scale);

    const leftFoot = drawJointedLimb(-6, 0, 13, pose.legLeft, 12, pose.legLeft * -0.45, colors.shorts, 7);
    const rightFoot = drawJointedLimb(6, 0, 13, pose.legRight, 12, pose.legRight * -0.45, colors.shorts, 7);
    dctx.fillStyle = colors.shoes;
    dctx.beginPath();
    dctx.ellipse(leftFoot.x + 2, leftFoot.y, 7, 3.5, 0, 0, Math.PI * 2);
    dctx.ellipse(rightFoot.x + 2, rightFoot.y, 7, 3.5, 0, 0, Math.PI * 2);
    dctx.fill();

    const backHand = drawJointedLimb(-11, -22, 12, pose.armLeft, 11, pose.armLeft * -0.35, colors.sleeves, 6);

    dctx.fillStyle = colors.jersey;
    dctx.beginPath();
    dctx.moveTo(-12, -25);
    dctx.quadraticCurveTo(0, -31, 12, -25);
    dctx.lineTo(10, 1);
    dctx.quadraticCurveTo(0, 6, -10, 1);
    dctx.closePath();
    dctx.fill();
    dctx.strokeStyle = '#172d36';
    dctx.lineWidth = 2;
    dctx.stroke();

    const frontHand = drawJointedLimb(11, -22, 12, pose.armRight, 11, pose.armRight * -0.35, colors.sleeves, 6);
    dctx.fillStyle = colors.skin;
    dctx.beginPath();
    dctx.arc(-1, -39, 12, 0, Math.PI * 2);
    dctx.fill();
    dctx.strokeStyle = '#172d36';
    dctx.lineWidth = 2;
    dctx.stroke();

    dctx.fillStyle = colors.cap;
    dctx.beginPath();
    dctx.arc(-2, -44, 12, Math.PI, Math.PI * 2);
    dctx.fill();
    dctx.fillRect(5, -45, 11, 4);
    dctx.fillStyle = '#172d36';
    dctx.beginPath();
    dctx.arc(3, -39, 1.7, 0, Math.PI * 2);
    dctx.fill();
    dctx.strokeStyle = '#7C2D12';
    dctx.beginPath();
    dctx.arc(3, -34, 5, 0.15, Math.PI - 0.15);
    dctx.stroke();

    if (hasGlove) {
      dctx.fillStyle = '#8B4513';
      dctx.beginPath();
      dctx.arc(backHand.x, backHand.y, 6, 0, Math.PI * 2);
      dctx.fill();
    } else {
      dctx.fillStyle = colors.skin;
      dctx.beginPath();
      dctx.arc(frontHand.x, frontHand.y, 3.5, 0, Math.PI * 2);
      dctx.fill();
    }
    dctx.restore();
  }

  function drawCharacterTag(label, x, y, color) {
    dctx.save();
    dctx.font = 'bold 7px monospace';
    dctx.textAlign = 'center';
    const width = dctx.measureText(label).width + 8;
    dctx.fillStyle = color;
    dctx.fillRect(x - width / 2, y, width, 11);
    dctx.fillStyle = '#FFFFFF';
    dctx.fillText(label, x, y + 8);
    dctx.restore();
  }

  function drawHotRodsRunner() {
    const animation = characterAnimations.HotRods_Run;
    if (!runnerAnimation || !animation) return;

    const progress = prefersReducedMotion ? 1 : Math.min(1, runnerAnimation.frame / runnerAnimation.totalFrames);
    let x, y;
    if (runnerAnimation.bases > 1 && progress > 0.58) {
      const secondLeg = (progress - 0.58) / 0.42;
      x = 535 + (360 - 535) * secondLeg;
      y = 250 + (145 - 250) * secondLeg - Math.sin(secondLeg * Math.PI) * 12;
    } else {
      const firstLeg = Math.min(1, progress / 0.58);
      x = 315 + (535 - 315) * firstLeg;
      y = 363 + (250 - 363) * firstLeg - Math.sin(firstLeg * Math.PI) * 18;
    }

    const pose = getCharacterPose(animation, runnerAnimation.frame);
    const appearance = getSelectedBatterAppearance();
    drawAnimatedKid(x, y, 0.88, pose, appearance);
    drawCharacterTag(getSelectedBatterTag(), x, y + 24, appearance.cap);
  }

  function updateCharacterAnimations() {
    characterIdleFrame++;
    if (pitcherAnimationFrame !== null) {
      pitcherAnimationFrame++;
      if (pitcherAnimationFrame >= (characterAnimations[activePitcherKey]?.durationFrames || 48)) {
        pitcherAnimationFrame = null;
      }
    }
    if (runnerAnimation && !prefersReducedMotion) runnerAnimation.frame++;
  }

  function startHotRodsRun(hitTitle) {
    runnerAnimation = {
      frame: 0,
      totalFrames: 92,
      bases: hitTitle === 'Single' ? 1 : 2
    };
  }

  function drawBatter(x, y) {
    const appearance = getSelectedBatterAppearance();
    const battingPose = {
      armLeft: -0.72,
      armRight: -1.06,
      legLeft: 0.18,
      legRight: -0.18,
      lean: batter.state === 'swinging' ? -0.14 : 0.05,
      bob: !prefersReducedMotion && batter.state === 'idle' ? Math.sin(characterIdleFrame / 18) : 0
    };
    drawAnimatedKid(x, y, 0.88, battingPose, appearance);

    // The bat remains a prop; the player's body is the same renderer used on the base path.
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
    drawCharacterTag(getSelectedBatterTag(), x, y + 24, appearance.cap);
  }

  function getSelectedBatterAppearance() {
    const identity = String(selectedKid?.id ?? selectedKid?.fullName ?? 'batyard-default');
    let seed = 0;
    for (const char of identity) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
    const skinTones = ['#F6C58F', '#D99A62', '#B66F3C', '#8D5524', '#6F3B22'];
    return {
      cap: '#0C2340',
      jersey: '#BA0C2F',
      sleeves: '#F8FAFC',
      shorts: '#0C2340',
      skin: skinTones[seed % skinTones.length],
      shoes: '#FFC72C'
    };
  }

  function getSelectedBatterTag() {
    const jersey = selectedKid?.jerseyNumber;
    return jersey && jersey !== '—' ? `BATS #${jersey}` : 'BATS';
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
    if (activeScreen !== 'screen-derby' || derbyPaused || !adaptiveModal.classList.contains('hidden')) {
      requestAnimationFrame(updateDerbyLoop);
      return;
    }
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
      updateCharacterAnimations();
      renderDerbyField();
    }
    requestAnimationFrame(updateDerbyLoop);
  }
  requestAnimationFrame(updateDerbyLoop);

  // Throw Pitch
  arcadePitchBtn?.addEventListener('click', () => {
    if (attemptPhase !== 'ready' || isDerbyPitching || derbyPaused || activeScreen !== 'screen-derby') return;
    attemptPhase = 'pitching';
    isDerbyPitching = true;
    arcadePitchBtn.disabled = true;
    arcadeSwingBtn.disabled = false;
    batter.state = 'idle';
    pitcherAnimationFrame = 0;

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
    if (attemptPhase !== 'pitching' || derbyPaused || !isDerbyPitching || ball.state !== 'pitching') return;
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
        toggleDerbyPause();
      }
    }
  });

  function handleDerbyHit(delta) {
    attemptPhase = 'resolving';
    strikes = 0;
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

    startHotRodsRun(hitTitle);
    hits++;
    if (dist > longestDist) longestDist = dist;
    addPoints(pts);
    hasPowerBat = false;
    if (powerActiveTag) powerActiveTag.classList.add('hidden');
    updateDerbyScore();

    setTimeout(finishAttempt, 1600);
  }

  function handleDerbyMiss() {
    if (attemptPhase !== 'pitching') return;
    attemptPhase = 'resolving';
    ball.state = 'missed';
    isDerbyPitching = false;
    arcadeSwingBtn.disabled = true;
    recordStrike('Missed pitch');
    setTimeout(finishAttempt, 1200);
  }

  function recordStrike(reason) {
    strikes++;
    announcerEl.textContent = `${reason}. Strike ${strikes}!`;
    speakAnnouncer("Strike!");
    if (strikes >= 3) {
      strikes = 0;
      outs++;
      announcerEl.textContent = `Strike three! ${outs} out${outs === 1 ? '' : 's'}.`;
    }
    if (outs >= 3) {
      announcerEl.textContent = 'Three outs! Side retired. Answer the next question to start a new inning.';
      speakAnnouncer("Three outs, side retired!");
      outs = 0;
    }
    updateDerbyScore();

  }

  function finishAttempt() {
    isDerbyPitching = false;
    ball.state = 'ready';
    batter.state = 'idle';
    runnerAnimation = null;
    activePitcherKey = activePitcherKey === 'Slugger_Pitcher' && characterAnimations.HotRods_Pitcher
      ? 'HotRods_Pitcher'
      : 'Slugger_Pitcher';
    attemptPhase = 'question';
    activeAdaptiveQuestion = null;
    hasPowerBat = false;
    powerActiveTag.classList.add('hidden');
    arcadePitchBtn.disabled = true;
    arcadeSwingBtn.disabled = true;
    if (activeScreen === 'screen-derby') openAdaptiveTimeout();
  }

  function updateDerbyScore() {
    document.querySelectorAll('#hud-strikes-dots .hud-dot').forEach((dot, index) => {
      dot.classList.toggle('on', index < strikes);
      dot.classList.toggle('off', index >= strikes);
    });
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
  let rosterLoading = null;

  function displayBatter() {
    if (!selectedKid) return;
    document.getElementById('current-batter-name').textContent = `${selectedKid.fullName} #${selectedKid.jerseyNumber}`;
    document.getElementById('hud-batter-display').textContent = `${selectedKid.fullName} — ${selectedKid.primaryPosition}`;
    document.getElementById('hud-avg').textContent = selectedKid.rawStats.battingAvg == null ? 'READY TO PLAY' : `${selectedKid.rawStats.battingAvg} AVG`;
  }

  async function ensureBatter() {
    if (!selectedKid) {
      if (!rosterLoading) rosterLoading = loadDugoutRoster().finally(() => { rosterLoading = null; });
      await rosterLoading;
    }
    displayBatter();
  }

  const escapeHTML = value => String(value ?? '—').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function loadDugoutRoster() {
    if (!rosterGrid) return;
    rosterGrid.innerHTML = '<p>Calling the dugout…</p>';

    try {
      const res = await fetch('/api/bats/characters');
      if (!res.ok) throw new Error('Roster unavailable');
      const data = await res.json();
      const chars = data.characters || [];
      if (!chars.length) throw new Error('Empty roster');
      rosterGrid.innerHTML = '';

      chars.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = `kid-select-card ${i === 0 ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="kid-select-header">
            <span class="kid-select-name">#${escapeHTML(c.jerseyNumber)} ${escapeHTML(c.fullName)}</span>
            <span class="kid-select-pos">${escapeHTML(c.primaryPosition)}</span>
          </div>
          <div class="kid-quirk-box">
            ${data.source === 'cached-mlb' ? 'Saved roster' : 'Louisville roster'} · Sandlot game ratings
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
      displayBatter();
    } catch (_) {
      rosterGrid.innerHTML = '<p>The dugout is offline. Play as yourself for now; visit again to load the Bats.</p>';
    }
  }

  document.getElementById('confirm-batter-btn')?.addEventListener('click', () => {
    if (selectedKid) {
      document.getElementById('current-batter-name').textContent = `${selectedKid.fullName.toUpperCase()} #${selectedKid.jerseyNumber}`;
      document.getElementById('hud-batter-display').textContent = `${selectedKid.fullName.toUpperCase()} - ${selectedKid.primaryPosition}`;
      displayBatter();
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
    const displayPct = winPct.toFixed(3).replace(/^0/, '');
    document.getElementById('saber-pyth-res').innerHTML = `Simulated Record: <strong>${displayPct} (${wins} Wins - ${162 - wins} Losses)</strong>`;
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
