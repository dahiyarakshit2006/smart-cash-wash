'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { frame, updateFrame } from '@/lib/frame';
import { journey } from '@/lib/journey';
import Vehicle from './Vehicle';

/** Runs first each frame and resolves the whole timeline. */
function FrameDriver() {
  useFrame((_, delta) => updateFrame(delta), -2);
  return null;
}

/**
 * Framing is responsive, not fixed. A narrow viewport crops a fixed camera
 * into a close-up of a door handle, so distance scales with aspect ratio —
 * and the subject is pushed clear of the column the copy occupies: right of
 * centre on wide screens, below the text on tall ones.
 */
function CameraRig() {
  const { camera, size } = useThree();

  useFrame(() => {
    const aspect = size.width / Math.max(1, size.height);
    const wide = aspect > 1.15;

    // Pull back as the frame narrows.
    const distance = THREE.MathUtils.mapLinear(
      THREE.MathUtils.clamp(aspect, 0.55, 2.1),
      2.1,
      0.55,
      1.18,
      2.05,
    );

    camera.position.copy(frame.cameraSmooth).multiplyScalar(distance);
    camera.lookAt(frame.targetSmooth);

    // Move the camera, not the car: shifting the lens left puts the vehicle
    // right of frame without ever changing the scene it is standing in.
    if (wide) camera.translateX(-1.45);
    else camera.translateY(0.85);
  });

  return null;
}

/**
 * The lighting carries the argument. Sodium amber over the problem, cold
 * clinical white through the system, mint only once the car is inside it,
 * and clean morning amber at the end.
 */
function LightRig() {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const accent = useRef<THREE.PointLight>(null);
  const sweep = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (key.current) {
      key.current.color.copy(frame.keyColor);
      key.current.intensity = frame.keyIntensity;
    }
    if (rim.current) {
      rim.current.color.copy(frame.rimColor);
      rim.current.intensity = frame.rimIntensity * 22;
    }
    if (amb.current) {
      amb.current.color.copy(frame.ambientColor);
      amb.current.intensity = frame.ambientIntensity;
    }
    if (accent.current) accent.current.intensity = frame.accent * 6;

    // The cleaning pass: a light travelling the length of the car during the wash.
    if (sweep.current) {
      const active = frame.wet > 0.5 && frame.dirt < 0.4;
      sweep.current.intensity = active ? 9 : 0;
      sweep.current.position.x = Math.sin(state.clock.elapsedTime * 1.1) * 2.6;
    }
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.6} />
      <directionalLight
        ref={key}
        position={[4.5, 7, 4]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <spotLight ref={rim} position={[-6, 4.5, -5]} angle={0.8} penumbra={1} intensity={20} />
      <pointLight ref={accent} position={[0, 2.1, -2.4]} color="#00E58F" intensity={0} distance={8} />
      <pointLight ref={sweep} position={[0, 1.9, 2.2]} color="#BFF7E2" intensity={0} distance={5} />

      {/* Static studio envmap: neutral reflections that make the paint read as paint. */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -3]} scale={[12, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-5, 2, 2]} scale={[6, 4, 1]} rotation={[0, Math.PI / 2.4, 0]} color="#cfe2ff" />
        <Lightformer form="rect" intensity={1.1} position={[5, 2, 2]} scale={[6, 4, 1]} rotation={[0, -Math.PI / 2.4, 0]} color="#e8f1ff" />
        <Lightformer form="ring" intensity={1.6} position={[0, 3, 6]} scale={4} color="#ffffff" />
      </Environment>
    </>
  );
}

/**
 * The car stays at the origin and the facility travels past it — which is why
 * the scroll feels like riding with the vehicle rather than watching it leave.
 */
function Corridor() {
  const group = useRef<THREE.Group>(null);
  const SPACING = 6;
  const COUNT = 7;
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame(() => {
    if (!group.current) return;
    const offset = ((frame.carXSmooth * 2) % SPACING) - SPACING;
    group.current.position.x = -offset;
    const lit = Math.min(1, Math.max(0, (journey.progress - 0.1) * 3));
    mats.current.forEach((m) => m && (m.emissiveIntensity = lit * 3.2));
  });

  return (
    <group ref={group}>
      {Array.from({ length: COUNT }).map((_, i) => {
        const x = (i - 2) * SPACING;
        return (
          <group key={i} position={[x, 0, 0]}>
            {/* Overhead light bar */}
            <mesh position={[0, 5.4, 0]}>
              <boxGeometry args={[0.28, 0.12, 9]} />
              <meshStandardMaterial
                ref={(m) => {
                  if (m) mats.current[i] = m as THREE.MeshStandardMaterial;
                }}
                color="#0E141C"
                emissive="#DCEEFF"
                emissiveIntensity={0}
                toneMapped={false}
              />
            </mesh>
            {/* Bay uprights */}
            {[5.2, -5.2].map((z) => (
              <mesh key={z} position={[0, 2.6, z]}>
                <boxGeometry args={[0.22, 5.2, 0.22]} />
                <meshStandardMaterial color="#0A0E14" roughness={0.7} metalness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Floor({ quality }: { quality: 'high' | 'low' }) {
  const mat = useRef<any>(null);
  useFrame(() => {
    if (mat.current) {
      mat.current.metalness = 0.35 + frame.floor * 0.55;
      mat.current.roughness = 0.85 - frame.floor * 0.55;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 60]} />
      {quality === 'high' ? (
        <MeshReflectorMaterial
          ref={mat}
          resolution={512}
          mixBlur={8}
          mixStrength={26}
          blur={[280, 90]}
          mirror={0.55}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.35}
          color="#05070A"
          metalness={0.7}
          roughness={0.45}
        />
      ) : (
        <meshStandardMaterial ref={mat} color="#05070A" metalness={0.6} roughness={0.5} />
      )}
    </mesh>
  );
}

export default function Scene({ quality }: { quality: 'high' | 'low' }) {
  const fog = useMemo(() => new THREE.FogExp2('#05070A', 0.035), []);
  return (
    <>
      <primitive attach="fog" object={fog} />
      <FrameDriver />
      <CameraRig />
      <LightRig />
      <Corridor />
      <Floor quality={quality} />
      <ContactShadows
        position={[0, 0.008, 0]}
        scale={13}
        resolution={quality === 'high' ? 1024 : 512}
        blur={2.4}
        opacity={0.85}
        far={3}
        frames={quality === 'high' ? Infinity : 1}
        color="#000000"
      />
      <Vehicle />
    </>
  );
}
