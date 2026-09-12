import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the actual frontend event handlers with deterministic frames, timers and requests.
function game({ offline = false } = {}) {
  const elements = new Map(), timers = [], requests = [];
  let frame, init;
  class Element {
    constructor() { this.className = ''; this.children = []; this.events = {}; this.disabled = false; this.textContent = ''; }
    classList = {
      contains: name => this.className.split(' ').includes(name),
      add: name => { if (!this.classList.contains(name)) this.className += ` ${name}`; },
      remove: name => { this.className = this.className.split(' ').filter(n => n !== name).join(' '); },
      toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name)
    };
    set innerHTML(value) { this.html = value; this.children = []; }
    get innerHTML() { return this.html || ''; }
    addEventListener(name, cb) { this.events[name] = cb; }
    click() { if (!this.disabled) this.events.click?.(); }
    appendChild(child) { this.children.push(child); }
    querySelectorAll() { return this.children; }
    getContext() { return new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} }); }
  }
  const el = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  el('modal-adaptive-timeout').className = 'hidden';
  el('arcade-pitch-btn').disabled = el('arcade-swing-btn').disabled = true;
  const dots = [new Element(), new Element()];
  const document = {
    getElementById: el,
    createElement: () => new Element(),
    querySelectorAll: selector => selector === '#hud-strikes-dots .hud-dot' ? dots : [],
    addEventListener: (_, callback) => { init = callback; }
  };
  vm.runInNewContext(fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8'), {
    document, window: { addEventListener() {} }, console,
    localStorage: { getItem: key => key === 'batyard_sound' ? 'false' : '0', setItem() {} },
    requestAnimationFrame: callback => { frame = callback; },
    setTimeout: callback => { timers.push(callback); },
    fetch: async (_, options) => {
      requests.push(JSON.parse(options.body));
      if (offline) throw new Error('Offline');
      return { ok: true, json: async () => ({ id: `q-${requests.length}`, difficulty: 3, q: `Question ${requests.length}`, options: ['Correct', 'Wrong'], ans: 0, explanation: 'Explanation' }) };
    }
  });
  init();
  const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
  return {
    el, dots, timers, requests, flush,
    start: async () => { el('start-game-btn').click(); await flush(); },
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
