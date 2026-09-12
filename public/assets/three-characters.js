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
    loadCharacter(loader, './models/HotRods_Pitcher.fbx', 61, 0),
    loadCharacter(loader, './models/Sluggers_Strike.fbx', 88, Math.PI),
    loadCharacter(loader, './models/Slugger_Run.fbx', 76, Math.PI)
  ]);

  scene.add(pitcher.group, batter.group, runner.group);
  pitcher.group.renderOrder = 1;
  batter.group.renderOrder = 2;
  runner.group.renderOrder = 2;

  let lastFrameTime = performance.now();
  let previousPitching = false;
  let previousSwinging = false;
  let previousRunning = false;

  bridge.render = state => {
    const now = performance.now();
    const elapsed = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    const pitching = Boolean(state.pitcher?.throwing);
    const swinging = Boolean(state.batter?.swinging);
    const running = Boolean(state.runner?.visible);
    const frozen = Boolean(state.paused || state.reducedMotion);

    pitcher.group.visible = Boolean(state.visible && state.pitcher);
    batter.group.visible = Boolean(state.visible && state.batter?.visible);
    runner.group.visible = Boolean(state.visible && running);

    placeAtCanvasPoint(pitcher.group, state.pitcher?.x ?? 360, state.pitcher?.y ?? 250, -20);
    placeAtCanvasPoint(batter.group, state.batter?.x ?? 300, state.batter?.y ?? 365, 20);
    if (state.runner) placeAtCanvasPoint(runner.group, state.runner.x, state.runner.y, 20);

    if (pitching && !previousPitching) playOnce(pitcher, 0.85);
    if (!pitching && previousPitching) resetToFirstFrame(pitcher);
    if (swinging && !previousSwinging) playOnce(batter, 0.32);
    if (!swinging && previousSwinging) resetToFirstFrame(batter);
    if (running && !previousRunning) playLoop(runner);
    if (!running && previousRunning) resetToFirstFrame(runner);

    if (!frozen) {
      pitcher.mixer.update(elapsed);
      batter.mixer.update(elapsed);
      runner.mixer.update(elapsed);
    }

    renderer.render(scene, camera);
    previousPitching = pitching;
    previousSwinging = swinging;
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

async function loadCharacter(loader, relativeUrl, targetHeight, rotationY) {
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
  const clip = object.animations[0];
  if (!clip) throw new Error(`Missing animation clip in ${relativeUrl}`);
  const action = mixer.clipAction(clip);
  action.play();
  action.paused = true;
  return { group, mixer, action, clip };
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
