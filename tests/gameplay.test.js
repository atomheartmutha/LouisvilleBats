import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the actual frontend event handlers with deterministic frames, timers and requests.
function game({ offline = false, sessionStore = new Map(), localStore = new Map() } = {}) {
  const elements = new Map(), timers = [], requests = [];
  let frame, init;
  class Element {
    constructor() { this.className = ''; this.children = []; this.events = {}; this.attributes = {}; this.disabled = false; this.textContent = ''; }
    classList = {
      contains: name => this.className.split(' ').includes(name),
      add: name => { if (!this.classList.contains(name)) this.className += ` ${name}`; },
      remove: name => { this.className = this.className.split(' ').filter(n => n !== name).join(' '); },
      toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name)
    };
    set innerHTML(value) { this.html = value; this.children = []; }
    get innerHTML() { return this.html || ''; }
    addEventListener(name, cb) { this.events[name] = cb; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    click() { if (!this.disabled) this.events.click?.(); }
    appendChild(child) { this.children.push(child); }
    querySelectorAll() { return this.children; }
    getContext() {
      return new Proxy({}, { get: (_, key) => {
        if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
        if (key === 'measureText') return text => ({ width: String(text).length * 6 });
        return () => {};
      } });
    }
  }
  const el = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  el('modal-adaptive-timeout').className = 'hidden';
  el('arcade-pitch-btn').disabled = el('arcade-swing-btn').disabled = true;
  const dots = [new Element(), new Element()];
  const gradeButtons = ['prek-k', 'grades-1-2', 'grades-3-5', 'grades-6-8', 'grades-9-plus'].map(band => {
    const button = new Element();
    button.setAttribute('data-grade-band', band);
    return button;
  });
  const document = {
    getElementById: el,
    createElement: () => new Element(),
    querySelectorAll: selector => selector === '#hud-strikes-dots .hud-dot' ? dots : selector === '.grade-band-btn' ? gradeButtons : [],
    addEventListener: (_, callback) => { init = callback; }
  };
  vm.runInNewContext(fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8'), {
    document, window: { addEventListener() {}, sessionStorage: { getItem: key => sessionStore.get(key) || null, setItem: (key, value) => sessionStore.set(key, value) } }, console,
    localStorage: {
      getItem: key => key === 'batyard_sound' ? 'false' : key === 'batyard_points' ? '0' : localStore.get(key) || null,
      setItem: (key, value) => localStore.set(key, value)
    },
    requestAnimationFrame: callback => { frame = callback; },
    setTimeout: callback => { timers.push(callback); },
    fetch: async (_, options) => {
      requests.push(JSON.parse(options.body));
      if (offline) throw new Error('Offline');
      return { ok: true, json: async () => ({ id: `q-${requests.length}`, factId: `fact-${requests.length}`, difficulty: 3, q: `Question ${requests.length}`, options: ['Correct', 'Wrong'], ans: 0, explanation: 'Explanation' }) };
    }
  });
  init();
  const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
  return {
    el, dots, timers, requests, flush,
    start: async () => { el('start-game-btn').click(); await flush(); },
    chooseGrade: band => gradeButtons.find(button => button.getAttribute('data-grade-band') === band).click(),
    answer: index => el('cat-options-grid').children[index].click(),
    frames: count => { for (let i = 0; i < count; i++) frame(); },
    nextTimer: async () => { assert.ok(timers.length); timers.shift()(); await flush(); }
  };
}

test('question gates every pitch; wrong answers advance once and three strikes make one out', async () => {
  const g = game(); await g.start();
  assert.equal(g.el('arcade-pitch-btn').disabled, true);
  assert.equal(g.el('modal-adaptive-timeout').classList.contains('hidden'), false);
  const firstAnswer = g.el('cat-options-grid').children[1];
  g.answer(1); firstAnswer.events.click(); // Also guard against duplicate queued events.
  assert.equal(g.timers.length, 1);
  assert.equal(g.dots[0].classList.contains('on'), true);
  await g.nextTimer();
  assert.equal(g.el('cat-question-text').textContent, 'Question 2');
  assert.equal(g.requests[1].excludeId, 'q-1');
  assert.deepEqual(g.requests[1].recentFactIds, ['fact-1']);
  assert.equal(g.requests[1].lastResult, false);
  g.answer(1); await g.nextTimer(); g.answer(1);
  assert.match(g.el('announcer-text').textContent, /Strike three! 1 out/);
  assert.equal(g.dots.some(dot => dot.classList.contains('on')), false);
});

test('an unattended pitch resolves once and another correct answer unlocks the next attempt', async () => {
  const g = game(); await g.start(); g.answer(0);
  assert.equal(g.el('arcade-pitch-btn').disabled, false);
  g.el('arcade-pitch-btn').click(); g.frames(100);
  const message = g.el('announcer-text').textContent;
  g.frames(100);
  assert.equal(g.el('announcer-text').textContent, message);
  assert.equal(g.timers.length, 1);
  assert.equal(g.el('arcade-swing-btn').disabled, true);
  await g.nextTimer();
  assert.equal(g.el('arcade-pitch-btn').disabled, true);
  assert.equal(g.el('cat-question-text').textContent, 'Question 2');
  g.answer(0); g.el('arcade-pitch-btn').click();
  assert.equal(g.el('arcade-swing-btn').disabled, false);
});

test('early swing and successful contact each consume exactly one earned pitch', async () => {
  const g = game(); await g.start(); g.answer(0);
  g.el('arcade-pitch-btn').click(); g.el('arcade-swing-btn').click(); g.frames(80);
  assert.equal(g.timers.length, 1);
  await g.nextTimer(); g.answer(0); g.el('arcade-pitch-btn').click();
  g.frames(29); g.el('arcade-swing-btn').click();
  assert.match(g.el('announcer-text').textContent, /CRACK|Solid contact/);
  await g.nextTimer();
  assert.equal(g.el('arcade-pitch-btn').disabled, true);
  assert.equal(g.requests.length, 3);
});

test('timeout pauses the ball without loading a question or spending the earned attempt', async () => {
  const g = game(); await g.start(); g.answer(0); g.el('arcade-pitch-btn').click();
  g.el('game-timeout-btn').click(); g.frames(100);
  assert.equal(g.timers.length, 0);
  assert.equal(g.requests.length, 1);
  g.el('game-timeout-btn').click(); g.frames(100);
  assert.equal(g.timers.length, 1);
});

test('leaving a required question cannot bypass it; offline questions remain answerable and rotate', async () => {
  const g = game({ offline: true }); await g.start();
  const first = g.el('cat-question-text').textContent;
  g.el('close-timeout-btn').click(); await g.start();
  assert.equal(g.el('arcade-pitch-btn').disabled, true);
  assert.equal(g.requests.length, 1);
  g.answer(0); await g.nextTimer();
  assert.notEqual(g.el('cat-question-text').textContent, first);
  g.answer(2);
  assert.equal(g.el('arcade-pitch-btn').disabled, false);
});

test('answered questions remain excluded after a new game starts in the same browser session', async () => {
  const sessionStore = new Map();
  const firstGame = game({ sessionStore }); await firstGame.start();
  firstGame.answer(1); await firstGame.nextTimer();
  const secondGame = game({ sessionStore }); await secondGame.start();
  assert.deepEqual(secondGame.requests[0].recentIds, ['q-1']);
  assert.deepEqual(secondGame.requests[0].recentFactIds, ['fact-1']);
});

test('selected grade band sets the first question level and persists for the next game', async () => {
  const localStore = new Map();
  const firstGame = game({ localStore });
  firstGame.chooseGrade('prek-k');
  await firstGame.start();
  assert.equal(firstGame.requests[0].currentTier, 1);
  assert.equal(firstGame.requests[0].gradeTier, 1);
  assert.equal(localStore.get('batyard_grade_band'), 'prek-k');

  const nextGame = game({ localStore });
  await nextGame.start();
  assert.equal(nextGame.requests[0].currentTier, 1);
  assert.equal(nextGame.requests[0].gradeTier, 1);
});
