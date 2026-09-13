import * as THREE from 'three';
import { FBXLoader } from './vendor/three/addons/loaders/FBXLoader.js';

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 420;
const canvas = document.getElementById('derby-character-canvas');

const bridge = {
  ready: false,
  error: null,
  version: 'three-r186-fbx',
  render() {}
};

window.BatyardThreeCharacters = bridge;

if (canvas) {
  initializeCharacterLayer().catch(error => {
    bridge.error = error;
    canvas.removeAttribute('data-ready');
    console.warn('Three.js characters unavailable; using Canvas fallback.', error);
  });
}

async function initializeCharacterLayer() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(VIEW_WIDTH, VIEW_HEIGHT, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -VIEW_WIDTH / 2,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    -VIEW_HEIGHT / 2,
    0.1,
    1000
  );
  camera.position.set(0, 0, 500);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff4d2, 0x315b3e, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(-180, 260, 320);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffc72c, 1.1);
  fillLight.position.set(220, 80, 180);
  scene.add(fillLight);

  const loader = new FBXLoader();
  const [pitcher, batter, runner] = await Promise.all([
    loadCharacter(loader, './models/HotRods_Pitcher.fbx', 61 * 0.88 * 1.06, 0),
    loadCharacter(loader, './models/Sluggers_Strike.fbx', 88 * 0.88 * 1.06, Math.PI),
    loadCharacter(loader, './models/Slugger_Run.fbx', 88 * 0.88 * 1.06, Math.PI, true)
  ]);

  scene.add(pitcher.group, batter.group, runner.group);
  const batBone = batter.group.getObjectByName('Bone');
  if (!batBone || batBone.parent?.name !== 'mixamorigRightHand') {
    throw new Error('Missing right-hand bat bone');
  }
  // The merged mesh's bat spans local Y=4..640 on Bone. This is its barrel.
  const barrelPoint = new THREE.Vector3(0, 520, 0);
  const contactProgress = 6 / 16;
  const contactTime = 1.5;
  function poseBatter(progress) {
    batter.action.paused = true;
    batter.action.time = progress <= contactProgress
      ? contactTime * progress / contactProgress
      : contactTime + (batter.clip.duration - contactTime) *
        (progress - contactProgress) / (1 - contactProgress);
    batter.mixer.update(0);
    scene.updateMatrixWorld(true);
  }
  placeAtCanvasPoint(batter.group, 306, 347, 20);
  poseBatter(contactProgress);
  const contact = batBone.localToWorld(barrelPoint.clone());
  bridge.contactPoint = { x: contact.x + VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 - contact.y };
  poseBatter(0);
  pitcher.group.renderOrder = 1;
  batter.group.renderOrder = 2;
  runner.group.renderOrder = 2;

  let lastFrameTime = performance.now();
  let previousPitching = false;
  let previousRunning = false;

  bridge.render = state => {
    const now = performance.now();
    const elapsed = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    const pitching = Boolean(state.pitcher?.throwing);
    const running = Boolean(state.runner?.visible);
    const frozen = Boolean(state.paused || state.reducedMotion);

    pitcher.group.visible = Boolean(state.visible && state.pitcher);
    batter.group.visible = Boolean(state.visible && state.batter?.visible);
    runner.group.visible = Boolean(state.visible && running);

    placeAtCanvasPoint(pitcher.group, state.pitcher?.x ?? 349, state.pitcher?.y ?? 268, -20);
    placeAtCanvasPoint(batter.group, state.batter?.x ?? 306, state.batter?.y ?? 347, 20);
    if (state.runner) {
      placeAtCanvasPoint(runner.group, state.runner.x, state.runner.y, 20);
      runner.group.scale.setScalar(runner.baseScale * state.runner.scale);
      runner.group.rotation.y = state.runner.heading;
    }

    if (pitching) {
      pitcher.action.paused = true;
      pitcher.action.time = Math.min(1, (state.pitcher.frame || 0) / 48) * pitcher.clip.duration;
      pitcher.mixer.update(0);
    }
    if (!pitching && previousPitching) resetToFirstFrame(pitcher);
    // The bat, body, and ball share one swing clock instead of separate timers.
    const swingProgress = state.batter?.swingProgress || 0;
    poseBatter(swingProgress);
    if (running && !previousRunning) playLoop(runner);
    if (!running && previousRunning) resetToFirstFrame(runner);

    if (!frozen) {

      runner.mixer.update(elapsed);
    }

    scene.updateMatrixWorld(true);
    const throwingHand = pitcher.group.getObjectByName('mixamorigRightHand');
    if (throwingHand) {
      const hand = throwingHand.getWorldPosition(new THREE.Vector3());
      bridge.pitchHand = { x: hand.x + VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 - hand.y };
    }
    renderer.render(scene, camera);
    previousPitching = pitching;
    previousRunning = running;
  };

  resetToFirstFrame(pitcher);
  resetToFirstFrame(batter);
  resetToFirstFrame(runner);
  renderer.render(scene, camera);
  bridge.ready = true;
  canvas.dataset.ready = 'true';
  window.dispatchEvent(new CustomEvent('batyard-three-ready'));
}

async function loadCharacter(loader, relativeUrl, targetHeight, rotationY, inPlace = false) {
  const object = await loader.loadAsync(new URL(relativeUrl, import.meta.url).href);
  object.traverse(child => {
    if (!child.isMesh) return;
    child.frustumCulled = false;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach(material => {
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    });
  });

  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error(`Invalid FBX bounds for ${relativeUrl}`);

  object.position.x -= center.x;
  object.position.y -= bounds.min.y;
  object.position.z -= center.z;

  const group = new THREE.Group();
  group.scale.setScalar(targetHeight / size.y);
  group.rotation.y = rotationY;
  group.add(object);

  const mixer = new THREE.AnimationMixer(object);
  const sourceClip = object.animations[0];
  const clip = sourceClip && (inPlace ? makeRunInPlace(sourceClip) : sourceClip);
  if (!clip) throw new Error(`Missing animation clip in ${relativeUrl}`);
  const action = mixer.clipAction(clip);
  action.play();
  action.paused = true;
  return { group, mixer, action, clip, baseScale: targetHeight / size.y };
}

function placeAtCanvasPoint(group, x, y, z) {
  group.position.set(x - VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - y, z);
}

function playOnce(character, duration) {
  character.action.reset();
  character.action.enabled = true;
  character.action.paused = false;
  character.action.setLoop(THREE.LoopOnce, 1);
  character.action.clampWhenFinished = true;
  character.action.setDuration(duration);
  character.action.play();
}

function playLoop(character) {
  character.action.reset();
  character.action.enabled = true;
  character.action.paused = false;
  character.action.setLoop(THREE.LoopRepeat, Infinity);
  character.action.clampWhenFinished = false;
  character.action.setEffectiveTimeScale(1);
  character.action.play();
}

function resetToFirstFrame(character) {
  character.action.stop();
  character.action.reset();
  character.action.play();
  character.action.paused = true;
  character.mixer.setTime(0);
}

// The base path owns travel. Keep the stride's vertical bounce, but prevent
// the FBX hip translation from moving away and snapping back every cycle.
function makeRunInPlace(sourceClip) {
  const clip = sourceClip.clone();
  for (const track of clip.tracks) {
    if (track.name !== 'mixamorigHips.position') continue;
    const x = track.values[0];
    const z = track.values[2];
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = x;
      track.values[i + 2] = z;
    }
  }
  return clip;
}
