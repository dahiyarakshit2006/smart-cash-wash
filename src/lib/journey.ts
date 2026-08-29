import * as THREE from 'three';

/**
 * The journey is one continuous scroll. Each stage owns an equal slice of it,
 * and every visual property of the 3D scene is a keyframe on this timeline.
 *
 * The colour-temperature arc is the argument of the page made physical:
 * the problem is lit in dingy sodium-vapour amber, the system is cold and
 * clinical, and the ending returns to amber — but clean morning amber, not
 * streetlight. The visitor feels the thesis before reading it.
 */

export type StageId =
  | 'problem'
  | 'transition'
  | 'arrival'
  | 'subscription'
  | 'water'
  | 'wash'
  | 'quality'
  | 'drying'
  | 'ready';

export type Keyframe = {
  id: StageId;
  /** Stage number shown in the UI. Null = not part of the numbered sequence. */
  index: number | null;
  label: string;
  camera: [number, number, number];
  target: [number, number, number];
  /** Car position along the facility axis. */
  carX: number;
  carRotY: number;
  /** Key light colour + intensity. */
  key: string;
  keyIntensity: number;
  /** Fill/rim colour — the cold side of the arc. */
  rim: string;
  rimIntensity: number;
  /** Ambient wash behind the car. */
  ambient: string;
  ambientIntensity: number;
  /** 0 = showroom clean, 1 = a week of Delhi dust. */
  dirt: number;
  /** 0 = dry, 1 = fully beaded. Drives droplet particles + clearcoat. */
  wet: number;
  /** Ground reflection strength. */
  floor: number;
  /** Accent (mint) rim light — only present once the car is inside the system. */
  accent: number;
};

export const stages: Keyframe[] = [
  {
    id: 'problem',
    index: null,
    label: 'Residential parking',
    camera: [5.2, 1.35, 6.4],
    target: [0, 0.7, 0],
    carX: 0,
    carRotY: -0.42,
    key: '#FF9A3C',
    keyIntensity: 4.2,
    rim: '#5C7E9C',
    rimIntensity: 2.2,
    ambient: '#2E2011',
    ambientIntensity: 1.3,
    dirt: 1,
    wet: 0,
    floor: 0.12,
    accent: 0,
  },
  {
    id: 'transition',
    index: null,
    label: 'Entering the system',
    camera: [4.4, 1.5, 7.4],
    target: [1.2, 0.75, 0],
    carX: 1.6,
    carRotY: -0.28,
    key: '#C9A57A',
    keyIntensity: 4.4,
    rim: '#7E9CB8',
    rimIntensity: 2.6,
    ambient: '#1A202C',
    ambientIntensity: 1.25,
    dirt: 0.96,
    wet: 0,
    floor: 0.3,
    accent: 0.15,
  },
  {
    id: 'arrival',
    index: 1,
    label: 'Arrival',
    camera: [0.4, 1.15, 9.2],
    target: [0.2, 0.72, 0],
    carX: 3.4,
    carRotY: -1.5708,
    key: '#E8F2FF',
    keyIntensity: 4.0,
    rim: '#8FB6D8',
    rimIntensity: 2.1,
    ambient: '#070B11',
    ambientIntensity: 0.85,
    dirt: 0.9,
    wet: 0,
    floor: 0.55,
    accent: 0.35,
  },
  {
    id: 'subscription',
    index: 2,
    label: 'Subscription',
    camera: [4.6, 1.6, 6.2],
    target: [0, 0.78, 0],
    carX: 4.6,
    carRotY: -0.72,
    key: '#F2F7FF',
    keyIntensity: 4.2,
    rim: '#9CC4E4',
    rimIntensity: 2.3,
    ambient: '#070B11',
    ambientIntensity: 0.9,
    dirt: 0.82,
    wet: 0,
    floor: 0.6,
    accent: 0.45,
  },
  {
    id: 'water',
    index: 3,
    label: 'Water management',
    camera: [-3.6, 1.7, 6.8],
    target: [-0.2, 0.8, 0],
    carX: 5.8,
    carRotY: -2.42,
    key: '#DCEEFF',
    keyIntensity: 3.0,
    rim: '#63D8F5',
    rimIntensity: 2.8,
    ambient: '#04090F',
    ambientIntensity: 0.9,
    dirt: 0.74,
    wet: 0.45,
    floor: 0.7,
    accent: 0.5,
  },
  {
    id: 'wash',
    index: 4,
    label: 'The wash',
    camera: [3.1, 1.05, 4.2],
    target: [0.1, 0.72, 0],
    carX: 7.2,
    carRotY: -1.05,
    key: '#FFFFFF',
    keyIntensity: 4.2,
    rim: '#7FE9C4',
    rimIntensity: 3.0,
    ambient: '#03070C',
    ambientIntensity: 1,
    dirt: 0.06,
    wet: 1,
    floor: 0.82,
    accent: 0.75,
  },
  {
    id: 'quality',
    index: 5,
    label: 'Quality control',
    camera: [-2.2, 2.5, 5.6],
    target: [0, 0.7, 0],
    carX: 8.6,
    carRotY: -2.05,
    key: '#F6FBFF',
    keyIntensity: 3.6,
    rim: '#00E58F',
    rimIntensity: 3.2,
    ambient: '#04090E',
    ambientIntensity: 0.95,
    dirt: 0.02,
    wet: 0.72,
    floor: 0.8,
    accent: 1,
  },
  {
    id: 'drying',
    index: 6,
    label: 'Drying',
    camera: [4.9, 1.25, 5.0],
    target: [0, 0.74, 0],
    carX: 9.9,
    carRotY: -0.58,
    key: '#FFFFFF',
    keyIntensity: 4.6,
    rim: '#BFE6FF',
    rimIntensity: 2.6,
    ambient: '#05090F',
    ambientIntensity: 1,
    dirt: 0,
    wet: 0.06,
    floor: 0.9,
    accent: 0.6,
  },
  {
    id: 'ready',
    index: 7,
    label: 'Ready',
    camera: [5.6, 1.5, 6.9],
    target: [0.1, 0.76, 0],
    carX: 11.4,
    carRotY: -0.5,
    key: '#FFD9A0',
    keyIntensity: 3.2,
    rim: '#9FC8E8',
    rimIntensity: 1.6,
    ambient: '#0C1017',
    ambientIntensity: 0.8,
    dirt: 0,
    wet: 0,
    floor: 0.7,
    accent: 0.3,
  },
];

/** Mutable scroll state, read every frame by the 3D scene without re-rendering React. */
export const journey = {
  /** 0 → 1 across the whole 3D journey region. */
  progress: 0,
  /** Index of the plan currently hovered in the subscription section, or -1. */
  hoveredPlan: -1,
  /** True once the user has scrolled past the journey. */
  parked: false,
  /** Honour prefers-reduced-motion: freeze the car, keep the lighting arc. */
  reducedMotion: false,
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const cA = new THREE.Color();
const cB = new THREE.Color();

type Numeric = Exclude<keyof Keyframe, 'id' | 'label' | 'index' | 'camera' | 'target' | 'key' | 'rim' | 'ambient'>;
type ColorKey = 'key' | 'rim' | 'ambient';
type VecKey = 'camera' | 'target';

/** Where we are on the timeline: which pair of keyframes, and how far between them. */
export function resolve(progress: number) {
  const p = THREE.MathUtils.clamp(progress, 0, 1) * (stages.length - 1);
  const i = Math.min(Math.floor(p), stages.length - 2);
  return { a: stages[i], b: stages[i + 1], t: easeInOut(p - i), index: i };
}

export function lerpNumber(a: Keyframe, b: Keyframe, t: number, key: Numeric) {
  return THREE.MathUtils.lerp(a[key] as number, b[key] as number, t);
}

export function lerpVec(a: Keyframe, b: Keyframe, t: number, key: VecKey, out: THREE.Vector3) {
  const va = a[key];
  const vb = b[key];
  return out.set(
    THREE.MathUtils.lerp(va[0], vb[0], t),
    THREE.MathUtils.lerp(va[1], vb[1], t),
    THREE.MathUtils.lerp(va[2], vb[2], t),
  );
}

export function lerpColor(a: Keyframe, b: Keyframe, t: number, key: ColorKey, out: THREE.Color) {
  cA.set(a[key]);
  cB.set(b[key]);
  return out.copy(cA).lerp(cB, t);
}

/** The active stage for UI chrome (nav readout). */
export function activeStage(progress: number): Keyframe {
  const p = THREE.MathUtils.clamp(progress, 0, 1) * (stages.length - 1);
  return stages[Math.round(p)];
}
