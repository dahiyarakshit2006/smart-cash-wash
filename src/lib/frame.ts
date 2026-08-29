import * as THREE from 'three';
import { resolve, lerpNumber, lerpVec, lerpColor, journey } from './journey';

/**
 * Every frame the driver resolves the journey timeline into these preallocated
 * objects. Children read them directly — no React state, no allocation, no
 * re-render. This is what keeps the scene at frame rate while a dozen
 * properties animate at once.
 */
export const frame = {
  camera: new THREE.Vector3(),
  target: new THREE.Vector3(),
  keyColor: new THREE.Color(),
  rimColor: new THREE.Color(),
  ambientColor: new THREE.Color(),
  carX: 0,
  carRotY: 0,
  keyIntensity: 0,
  rimIntensity: 0,
  ambientIntensity: 0,
  dirt: 1,
  wet: 0,
  floor: 0,
  accent: 0,
  /** Smoothed camera, so scroll jitter never reaches the lens. */
  cameraSmooth: new THREE.Vector3(5.2, 1.35, 6.4),
  targetSmooth: new THREE.Vector3(0, 0.7, 0),
  carXSmooth: 0,
  carRotYSmooth: -0.42,
};

export function updateFrame(delta: number) {
  const { a, b, t } = resolve(journey.progress);

  lerpVec(a, b, t, 'camera', frame.camera);
  lerpVec(a, b, t, 'target', frame.target);
  lerpColor(a, b, t, 'key', frame.keyColor);
  lerpColor(a, b, t, 'rim', frame.rimColor);
  lerpColor(a, b, t, 'ambient', frame.ambientColor);

  frame.carX = lerpNumber(a, b, t, 'carX');
  frame.carRotY = lerpNumber(a, b, t, 'carRotY');
  frame.keyIntensity = lerpNumber(a, b, t, 'keyIntensity');
  frame.rimIntensity = lerpNumber(a, b, t, 'rimIntensity');
  frame.ambientIntensity = lerpNumber(a, b, t, 'ambientIntensity');
  frame.dirt = lerpNumber(a, b, t, 'dirt');
  frame.wet = lerpNumber(a, b, t, 'wet');
  frame.floor = lerpNumber(a, b, t, 'floor');
  frame.accent = lerpNumber(a, b, t, 'accent');

  // Critically damped follow. Reduced motion pins the car but keeps the light.
  const k = 1 - Math.exp(-6 * Math.min(delta, 0.1));
  frame.cameraSmooth.lerp(frame.camera, k);
  frame.targetSmooth.lerp(frame.target, k);

  if (journey.reducedMotion) {
    frame.carXSmooth = 0;
    frame.carRotYSmooth = -0.42;
  } else {
    frame.carXSmooth = THREE.MathUtils.lerp(frame.carXSmooth, frame.carX, k);
    frame.carRotYSmooth = THREE.MathUtils.lerp(frame.carRotYSmooth, frame.carRotY, k);
  }
}
