// Browser-ready pose data for the FBX source clips kept in /Assets.
// The Canvas renderer uses these compact keyframes so animation stays local,
// fast, and resilient on crowded stadium Wi-Fi.
(function registerBatyardCharacterAnimations() {
  const animations = {
    Slugger_Pitcher: {
      sourceFile: 'Assets/Slugger_Pitcher.fbx',
      durationFrames: 48,
      poses: [
        { at: 0, armLeft: -0.35, armRight: 0.35, legLeft: 0.08, legRight: -0.08, lean: 0, bob: 0 },
        { at: 0.2, armLeft: 0.8, armRight: 2.6, legLeft: -0.15, legRight: 0.15, lean: -0.08, bob: -3 },
        { at: 0.42, armLeft: 1.3, armRight: 3.35, legLeft: -1.1, legRight: 0.2, lean: -0.18, bob: -7 },
        { at: 0.66, armLeft: -0.9, armRight: -1.65, legLeft: 0.55, legRight: -0.42, lean: 0.25, bob: 2 },
        { at: 0.84, armLeft: -1.55, armRight: -0.8, legLeft: 0.25, legRight: -0.2, lean: 0.12, bob: 1 },
        { at: 1, armLeft: -0.35, armRight: 0.35, legLeft: 0.08, legRight: -0.08, lean: 0, bob: 0 }
      ]
    },
    HotRods_Pitcher: {
      sourceFile: 'Assets/HotRods_Pitcher.fbx',
      durationFrames: 44,
      poses: [
        { at: 0, armLeft: 0.45, armRight: -0.4, legLeft: -0.08, legRight: 0.08, lean: 0, bob: 0 },
        { at: 0.18, armLeft: 2.5, armRight: 0.9, legLeft: 0.16, legRight: -0.16, lean: 0.1, bob: -2 },
        { at: 0.4, armLeft: 3.25, armRight: 1.4, legLeft: 0.25, legRight: -1.05, lean: 0.2, bob: -7 },
        { at: 0.62, armLeft: -1.5, armRight: -0.8, legLeft: -0.45, legRight: 0.6, lean: -0.28, bob: 2 },
        { at: 0.82, armLeft: -0.7, armRight: -1.45, legLeft: -0.2, legRight: 0.25, lean: -0.12, bob: 1 },
        { at: 1, armLeft: 0.45, armRight: -0.4, legLeft: -0.08, legRight: 0.08, lean: 0, bob: 0 }
      ]
    },
    HotRods_Run: {
      sourceFile: 'Assets/HotRods_Run.fbx',
      durationFrames: 24,
      poses: [
        { at: 0, armLeft: 0.9, armRight: -0.9, legLeft: -0.72, legRight: 0.72, lean: 0.12, bob: 0 },
        { at: 0.25, armLeft: 0.1, armRight: -0.1, legLeft: -0.05, legRight: 0.05, lean: 0.14, bob: -4 },
        { at: 0.5, armLeft: -0.9, armRight: 0.9, legLeft: 0.72, legRight: -0.72, lean: 0.12, bob: 0 },
        { at: 0.75, armLeft: -0.1, armRight: 0.1, legLeft: 0.05, legRight: -0.05, lean: 0.14, bob: -4 },
        { at: 1, armLeft: 0.9, armRight: -0.9, legLeft: -0.72, legRight: 0.72, lean: 0.12, bob: 0 }
      ]
    }
  };

  window.BatyardCharacterAnimations = Object.freeze(animations);
})();
