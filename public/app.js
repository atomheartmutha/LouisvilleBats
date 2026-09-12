// Batyard Slugger — Main Client Controller

document.addEventListener('DOMContentLoaded', () => {
  let globalPoints = 0;
  const globalPointsEl = document.getElementById('global-points');

  function addPoints(pts) {
    globalPoints += pts;
    globalPointsEl.textContent = globalPoints;
  }

  // ============================================================
  // TAB NAVIGATION
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
    });
  });

  // ============================================================
  // LEVEL 1: PRE-K COLORING DUGOUT
  // ============================================================
  const colorCanvas = document.getElementById('coloring-canvas');
  const cctx = colorCanvas.getContext('2d');
  let isDrawing = false;
  let currentColor = '#BA0C2F';
  let currentBrushSize = 10;
  let currentTemplate = 'buddy';

  // Palette buttons
  const crayonBtns = document.querySelectorAll('.crayon-btn');
  crayonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      crayonBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.getAttribute('data-color');
    });
  });

  // Brush sizes
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBrushSize = parseInt(btn.getAttribute('data-size'), 10);
    });
  });

  // Template picker
  const tmplBtns = document.querySelectorAll('.tmpl-btn');
  tmplBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tmplBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTemplate = btn.getAttribute('data-tmpl');
      redrawColoringTemplate();
    });
  });

  function redrawColoringTemplate() {
    cctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
    cctx.fillStyle = '#FFFFFF';
    cctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    cctx.strokeStyle = '#0C2340';
    cctx.lineWidth = 3;
    cctx.fillStyle = '#1E3A5F';
    cctx.lineCap = 'round';
    cctx.lineJoin = 'round';

    if (currentTemplate === 'buddy') {
      // Draw Buddy Bat Outline for Kids to Color
      cctx.font = 'bold 20px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('🦇 Buddy Bat: Louisville Bats', 300, 40);

      // Bat Body
      cctx.beginPath();
      cctx.ellipse(300, 240, 55, 75, 0, 0, Math.PI * 2);
      cctx.stroke();

      // Bat Head
      cctx.beginPath();
      cctx.arc(300, 140, 45, 0, Math.PI * 2);
      cctx.stroke();

      // Ears
      cctx.beginPath();
      cctx.moveTo(270, 110);
      cctx.lineTo(255, 55);
      cctx.lineTo(285, 100);
      cctx.stroke();

      cctx.beginPath();
      cctx.moveTo(330, 110);
      cctx.lineTo(345, 55);
      cctx.lineTo(315, 100);
      cctx.stroke();

      // Wings Outline
      cctx.beginPath();
      cctx.moveTo(250, 210);
      cctx.bezierCurveTo(140, 120, 80, 200, 100, 290);
      cctx.bezierCurveTo(150, 260, 200, 280, 250, 260);
      cctx.stroke();

      cctx.beginPath();
      cctx.moveTo(350, 210);
      cctx.bezierCurveTo(460, 120, 520, 200, 500, 290);
      cctx.bezierCurveTo(450, 260, 400, 280, 350, 260);
      cctx.stroke();

      // Big Smile & Eyes
      cctx.beginPath();
      cctx.arc(285, 135, 7, 0, Math.PI * 2);
      cctx.arc(315, 135, 7, 0, Math.PI * 2);
      cctx.stroke();

      cctx.beginPath();
      cctx.arc(300, 155, 20, 0, Math.PI);
      cctx.stroke();

      // Louisville Slugger Bat in hand
      cctx.beginPath();
      cctx.rect(360, 170, 160, 14);
      cctx.stroke();
      cctx.font = 'bold 9px sans-serif';
      cctx.fillText('LOUISVILLE SLUGGER', 440, 180);

    } else if (currentTemplate === 'diamond') {
      // Ballpark Diamond & Bases
      cctx.font = 'bold 20px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('⚾ Louisville Slugger Field Diamond', 300, 40);

      // Infield Diamond
      cctx.beginPath();
      cctx.moveTo(300, 90);  // 2nd Base
      cctx.lineTo(440, 220); // 1st Base
      cctx.lineTo(300, 350); // Home Plate
      cctx.lineTo(160, 220); // 3rd Base
      cctx.closePath();
      cctx.stroke();

      // Home Plate Pentagon (KY Standard shape recognition)
      cctx.beginPath();
      cctx.moveTo(300, 340);
      cctx.lineTo(315, 355);
      cctx.lineTo(315, 375);
      cctx.lineTo(285, 375);
      cctx.lineTo(285, 355);
      cctx.closePath();
      cctx.stroke();
      cctx.fillText('HOME PLATE (PENTAGON)', 300, 410);

      // Bases
      drawBaseMarker(cctx, 300, 90);
      drawBaseMarker(cctx, 440, 220);
      drawBaseMarker(cctx, 160, 220);

    } else if (currentTemplate === 'cap') {
      // Louisville Bats Mascot Cap & Baseball
      cctx.font = 'bold 20px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('🧢 Louisville Bats Cap & Ball', 300, 40);

      // Baseball Cap
      cctx.beginPath();
      cctx.arc(280, 200, 80, Math.PI, 0);
      cctx.stroke();
      cctx.beginPath();
      cctx.ellipse(320, 200, 110, 25, 0.1, 0, Math.PI);
      cctx.stroke();
      cctx.font = 'bold 36px sans-serif';
      cctx.fillText('🦇', 280, 175);

      // Big Baseball with Seams
      cctx.beginPath();
      cctx.arc(380, 320, 55, 0, Math.PI * 2);
      cctx.stroke();
      cctx.beginPath();
      cctx.arc(360, 320, 40, -Math.PI / 2.5, Math.PI / 2.5);
      cctx.stroke();
      cctx.beginPath();
      cctx.arc(400, 320, 40, Math.PI - Math.PI / 2.5, Math.PI + Math.PI / 2.5);
      cctx.stroke();
    }
  }

  function drawBaseMarker(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-12, -12, 24, 24);
    ctx.restore();
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
    isDrawing = true;
    const pos = getCanvasPos(e);
    cctx.beginPath();
    cctx.moveTo(pos.x, pos.y);
  }

  function drawMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    cctx.strokeStyle = currentColor;
    cctx.lineWidth = currentBrushSize;
    cctx.lineTo(pos.x, pos.y);
    cctx.stroke();
  }

  function stopDraw() {
    isDrawing = false;
  }

  colorCanvas.addEventListener('mousedown', startDraw);
  colorCanvas.addEventListener('mousemove', drawMove);
  window.addEventListener('mouseup', stopDraw);

  colorCanvas.addEventListener('touchstart', startDraw, { passive: false });
  colorCanvas.addEventListener('touchmove', drawMove, { passive: false });
  window.addEventListener('touchend', stopDraw);

  document.getElementById('clear-canvas-btn').addEventListener('click', redrawColoringTemplate);
  document.getElementById('download-art-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `buddy-bat-drawing.png`;
    link.href = colorCanvas.toDataURL('image/png');
    link.click();
    addPoints(25);
  });

  // Pre-K Quiz Engine
  let prekCurrentQ = null;
  async function loadPrekQuestion() {
    const qEl = document.getElementById('prek-question-text');
    const optsEl = document.getElementById('prek-options-grid');
    const fbEl = document.getElementById('prek-feedback');
    const stdEl = document.getElementById('prek-standard');
    fbEl.className = 'quiz-feedback hidden';
    optsEl.innerHTML = '';
    qEl.textContent = 'Buddy Bat is fetching a fun question...';

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'pre-k' })
      });
      prekCurrentQ = await res.json();
      qEl.textContent = prekCurrentQ.q;
      stdEl.textContent = prekCurrentQ.standard || 'KY Early Childhood Standards';

      prekCurrentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          fbEl.classList.remove('hidden');
          if (idx === prekCurrentQ.ans) {
            fbEl.className = 'quiz-feedback correct';
            fbEl.innerHTML = `🌟 <strong>CORRECT! +25 Points!</strong> ${prekCurrentQ.explanation}`;
            addPoints(25);
          } else {
            fbEl.className = 'quiz-feedback incorrect';
            fbEl.innerHTML = `Great try! Keep counting! Answer: <strong>${prekCurrentQ.options[prekCurrentQ.ans]}</strong>.`;
          }
        });
        optsEl.appendChild(btn);
      });
    } catch (e) {
      qEl.textContent = "Count Buddy's baseballs: ⚾ ⚾ ⚾. How many?";
    }
  }

  document.getElementById('next-prek-q').addEventListener('click', loadPrekQuestion);
  redrawColoringTemplate();
  loadPrekQuestion();

  // ============================================================
  // LEVEL 2: 3RD–5TH GRADE BATYARD DERBY (KAS MATH & SCIENCE)
  // ============================================================
  const derbyCanvas = document.getElementById('derby-canvas');
  const dctx = derbyCanvas.getContext('2d');
  const pitchBtn = document.getElementById('derby-pitch-btn');
  const swingBtn = document.getElementById('derby-swing-btn');
  const powerBtn = document.getElementById('derby-power-btn');
  const outsEl = document.getElementById('derby-outs');
  const hitsEl = document.getElementById('derby-hits');
  const hrEl = document.getElementById('derby-hr');
  const distEl = document.getElementById('derby-dist');
  const announcerEl = document.getElementById('derby-announcer');

  let outs = 0, hits = 0, hr = 0, longestDist = 0;
  let isDerbyPitching = false;
  let hasPowerBat = false;
  let ball = { x: 350, y: 160, r: 7, vx: 0, vy: 0, state: 'ready' };
  let batter = { x: 310, y: 350, state: 'idle' };

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
    announcerEl.textContent = "Here comes the pitch from the mound! Time your swing!";
  });

  function performDerbySwing() {
    if (!isDerbyPitching || ball.state !== 'pitching') return;
    swingBtn.disabled = true;
    batter.state = 'swinging';

    const timingDelta = Math.abs(ball.y - 375);
    if (timingDelta < 30) {
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
    let dist = 240;
    let hitTitle = 'Single';
    let pts = 50;

    if (hasPowerBat || delta < 10) {
      dist = Math.floor(385 + Math.random() * 65);
      hitTitle = hasPowerBat ? 'GRAND SLAM' : 'HOME RUN';
      pts = 200;
      hr++;
      ball.vy = -6.8;
      ball.vx = (Math.random() - 0.5) * 2;
      announcerEl.textContent = `CRACK! A towering ${dist} FT ${hitTitle} splashing right into the Ohio River!`;
    } else {
      dist = Math.floor(250 + Math.random() * 50);
      hitTitle = delta < 20 ? 'Double' : 'Single';
      pts = 100;
      ball.vy = -4.5;
      ball.vx = (Math.random() > 0.5 ? 3 : -3);
      announcerEl.textContent = `Solid contact! Struck cleanly into the gap for a ${dist} FT ${hitTitle}!`;
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
    if (outs >= 3) {
      announcerEl.textContent = `Three outs! Side retired! Inning complete. Click Throw Pitch for the next inning!`;
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

  const timeoutBtn = document.getElementById('bb97-timeout-btn');
  if (timeoutBtn) {
    timeoutBtn.addEventListener('click', loadElemQuestion);
  }

  // 3rd-5th Grade Math & Science Quiz
  let elemCurrentQ = null;
  async function loadElemQuestion() {
    const qEl = document.getElementById('elem-q-text');
    const optsEl = document.getElementById('elem-opts-container');
    const fbEl = document.getElementById('elem-feedback');
    fbEl.className = 'edu-feedback hidden';
    optsEl.innerHTML = '';
    qEl.textContent = 'Loading Kentucky standard question...';

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'grades-3-5' })
      });
      elemCurrentQ = await res.json();
      qEl.textContent = elemCurrentQ.q;

      elemCurrentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'edu-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          fbEl.classList.remove('hidden');
          if (idx === elemCurrentQ.ans) {
            hasPowerBat = true;
            fbEl.className = 'edu-feedback correct';
            fbEl.innerHTML = `⚡ <strong>CORRECT! +50 Points! 3X Power Bat Activated!</strong><br>${elemCurrentQ.explanation}`;
            announcerEl.textContent = `⚡ Math/Science Power-Up Activated! Next hit is supercharged!`;
            addPoints(50);
          } else {
            fbEl.className = 'edu-feedback incorrect';
            fbEl.innerHTML = `Nice effort! Standard explanation: ${elemCurrentQ.explanation}`;
          }
        });
        optsEl.appendChild(btn);
      });
    } catch (e) {
      qEl.textContent = "What is 3 hits in 10 at-bats expressed as a decimal? (.300)";
    }
  }

  document.getElementById('next-elem-q').addEventListener('click', loadElemQuestion);
  powerBtn.addEventListener('click', loadElemQuestion);
  loadElemQuestion();

  // ============================================================
  // LEVEL 3: POST-SECONDARY SABERMETRICS
  // ============================================================
  // 1. Pythagorean Expectancy Calculator
  document.getElementById('calc-pyth-btn').addEventListener('click', () => {
    const rs = parseFloat(document.getElementById('pyth-rs').value) || 680;
    const ra = parseFloat(document.getElementById('pyth-ra').value) || 610;
    const gamma = 1.83;
    const winPct = Math.pow(rs, gamma) / (Math.pow(rs, gamma) + Math.pow(ra, gamma));
    const wins162 = Math.round(winPct * 162);
    document.getElementById('pyth-result').innerHTML = `Expected Win%: <strong>.${Math.round(winPct * 1000)} (${wins162} Wins / 162 G)</strong> &bull; Run Diff: +${Math.round(rs - ra)}`;
    addPoints(15);
  });

  // 2. wOBA Calculator
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
    addPoints(15);
  });

  // 3. RE24 Markov State Matrix
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

  // 4. Post-Secondary Quiz
  let postsecCurrentQ = null;
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
        body: JSON.stringify({ level: 'post-secondary' })
      });
      postsecCurrentQ = await res.json();
      qEl.textContent = postsecCurrentQ.q;

      postsecCurrentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'edu-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          fbEl.classList.remove('hidden');
          if (idx === postsecCurrentQ.ans) {
            fbEl.className = 'edu-feedback correct';
            fbEl.innerHTML = `📊 <strong>CORRECT! +100 Points!</strong><br>${postsecCurrentQ.explanation}`;
            addPoints(100);
          } else {
            fbEl.className = 'edu-feedback incorrect';
            fbEl.innerHTML = `Analysis: ${postsecCurrentQ.explanation}`;
          }
        });
        optsEl.appendChild(btn);
      });
    } catch (e) {
      qEl.textContent = "What is the Pythagorean win expectation exponent? (1.83)";
    }
  }

  document.getElementById('next-postsec-q').addEventListener('click', loadPostsecQuestion);
  loadPostsecQuestion();

  // ============================================================
  // TAB 4: ROSTER GRID (MLB STATS API)
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
