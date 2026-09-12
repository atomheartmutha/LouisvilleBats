import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const assetSource = fs.readFileSync(new URL('public/assets/character-animations.js', root), 'utf8');
const threeSource = fs.readFileSync(new URL('public/assets/three-characters.js', root), 'utf8');
const appSource = fs.readFileSync(new URL('public/app.js', root), 'utf8');
const html = fs.readFileSync(new URL('public/index.html', root), 'utf8');
const css = fs.readFileSync(new URL('public/style.css', root), 'utf8');

test('requested pitcher and runner animation assets are local and well formed', () => {
  const window = {};
  vm.runInNewContext(assetSource, { window });
  const animations = window.BatyardCharacterAnimations;

  assert.deepEqual(Object.keys(animations), ['Slugger_Pitcher', 'HotRods_Pitcher', 'HotRods_Run']);
  assert.equal(animations.Slugger_Pitcher.sourceFile, 'Assets/Slugger_Pitcher.fbx');
  assert.equal(animations.HotRods_Pitcher.sourceFile, 'Assets/HotRods_Pitcher.fbx');
  assert.equal(animations.HotRods_Run.sourceFile, 'Assets/HotRods_Run.fbx');
  for (const animation of Object.values(animations)) {
    assert.ok(animation.durationFrames > 1);
    assert.ok(animation.poses.length >= 5);
    assert.equal(animation.poses[0].at, 0);
    assert.equal(animation.poses.at(-1).at, 1);
  }

  assert.ok(fs.existsSync(new URL('Assets/Slugger_Pitcher.fbx', root)));
  assert.ok(fs.existsSync(new URL('Assets/HotRods_Pitcher.fbx', root)));
  assert.ok(fs.existsSync(new URL('Assets/HotRods_Run.fbx', root)));
});

test('gameplay loads and triggers both character animation roles', () => {
  assert.match(html, /assets\/character-animations\.js/);
  assert.ok(html.indexOf('assets/character-animations.js') < html.indexOf('app.js'));
  assert.match(appSource, /characterAnimations\.Slugger_Pitcher/);
  assert.match(appSource, /characterAnimations\.HotRods_Pitcher/);
  assert.match(appSource, /characterAnimations\.HotRods_Run/);
  assert.match(appSource, /activePitcherKey === 'Slugger_Pitcher'/);
  assert.match(appSource, /pitcherAnimationFrame = 0/);
  assert.match(appSource, /startHotRodsRun\(hitTitle\)/);
  assert.match(appSource, /runnerAnimation = null/);
});

test('Three.js swaps in the real FBX characters while Canvas remains the fallback', () => {
  const modelPairs = [
    ['Assets/HotRods_Pitcher.fbx', 'public/assets/models/HotRods_Pitcher.fbx'],
    ['Assets/Sluggers_Strike.fbx', 'public/assets/models/Sluggers_Strike.fbx'],
    ['Assets/Slugger_Run.fbx', 'public/assets/models/Slugger_Run.fbx']
  ];

  for (const [sourcePath, publicPath] of modelPairs) {
    const sourceModel = fs.readFileSync(new URL(sourcePath, root));
    const publicModel = fs.readFileSync(new URL(publicPath, root));
    assert.deepEqual(publicModel, sourceModel);
    assert.match(publicModel.subarray(0, 23).toString(), /Kaydara FBX Binary/);
  }

  assert.ok(fs.existsSync(new URL('public/assets/vendor/three/LICENSE', root)));
  const threeModule = fs.readFileSync(new URL('public/assets/vendor/three/three.module.js', root), 'utf8');
  assert.match(threeModule, /from '\.\/three\.core\.js'/);
  assert.ok(fs.existsSync(new URL('public/assets/vendor/three/three.core.js', root)));
  assert.match(html, /type="importmap"/);
  assert.match(html, /assets\/vendor\/three\/three\.module\.js/);
  assert.match(html, /id="derby-character-canvas"/);
  assert.ok(html.indexOf('assets/three-characters.js') < html.indexOf('app.js'));
  assert.match(css, /#derby-character-canvas\s*\{[\s\S]*position: absolute/);
  assert.match(css, /#derby-character-canvas\[data-ready="true"\]/);

  assert.match(threeSource, /new THREE\.WebGLRenderer/);
  assert.match(threeSource, /new THREE\.AnimationMixer/);
  assert.match(threeSource, /HotRods_Pitcher\.fbx/);
  assert.match(threeSource, /Sluggers_Strike\.fbx/);
  assert.match(threeSource, /Slugger_Run\.fbx/);
  assert.match(threeSource, /Three\.js characters unavailable; using Canvas fallback/);

  const renderer = appSource.slice(
    appSource.indexOf('function renderDerbyField()'),
    appSource.indexOf('function drawDerbyBackground()')
  );
  assert.match(renderer, /const usingThreeCharacters = renderThreeCharacters\(\)/);
  assert.match(renderer, /if \(!usingThreeCharacters\) drawPitcher/);
  assert.match(renderer, /if \(!usingThreeCharacters\) \{/);
  assert.match(appSource, /characterLayer\.ready = false/);
});

test('a hit completes a visible bat arc before switching to the runner', () => {
  const swingHandler = appSource.slice(
    appSource.indexOf('function performSwing()'),
    appSource.indexOf("arcadeSwingBtn?.addEventListener('click', performSwing)")
  );
  assert.match(appSource, /batterSwingFrame = 0/);
  assert.match(appSource, /swingProgress \* swingProgress \* \(3 - 2 \* swingProgress\)/);
  assert.match(appSource, /0\.55 - swingEase \* 2\.6/);
  assert.match(appSource, /if \(!runnerAnimation \|\| batterSwingFrame !== null\) drawBatter/);
  assert.match(appSource, /if \(batterSwingFrame === null\) drawHotRodsRunner/);
  assert.ok(swingHandler.indexOf('batterSwingFrame = 0') < swingHandler.indexOf('handleDerbyHit(timingDelta)'));
});

test('the drafted batter keeps one identity while batting and running', () => {
  assert.match(appSource, /function getSelectedBatterAppearance\(\)/);
  assert.match(appSource, /function getSelectedBatterTag\(\)/);
  const appearanceUses = appSource.match(/const appearance = getSelectedBatterAppearance\(\);/g) || [];
  assert.equal(appearanceUses.length, 2);
  assert.match(appSource, /skin: skinTones\[seed % skinTones\.length\]/);
  assert.match(appSource, /drawAnimatedKid\(x, y, 0\.88, battingPose, appearance\)/);
  assert.match(appSource, /drawAnimatedKid\(x, y, 0\.88, pose, appearance\)/);
});

test('derby uses the supplied Louisville stadium artwork as its field background', () => {
  const sourceArtwork = fs.readFileSync(new URL('Assets/Setting.png', root));
  const publicArtwork = fs.readFileSync(new URL('public/assets/images/setting.png', root));
  assert.deepEqual(publicArtwork, sourceArtwork);
  assert.match(appSource, /derbyBackgroundImage\.src = 'assets\/images\/setting\.png'/);
  assert.match(appSource, /function drawDerbyBackground\(\)/);
  assert.match(appSource, /dctx\.drawImage\(/);

  const renderSource = appSource.slice(
    appSource.indexOf('function renderDerbyField()'),
    appSource.indexOf('function drawDerbyBackground()')
  );
  assert.match(renderSource, /drawDerbyBackground\(\);/);
  assert.doesNotMatch(renderSource, /createLinearGradient|drawLouisvilleSkyline|drawOhioRiverBridges|drawSandlotTexture/);
  assert.match(html, /aria-label="Louisville Slugger Field viewed from behind home plate/);
});
