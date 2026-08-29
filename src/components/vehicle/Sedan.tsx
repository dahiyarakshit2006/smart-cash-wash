'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame } from '@/lib/frame';
import { journey } from '@/lib/journey';
import { plans } from '@/config/pricing';

/**
 * An original premium sedan, built procedurally.
 *
 * Deliberately NOT a licensed third-party model: this is our own silhouette,
 * drawn from the proportions that read as "expensive German saloon" — long
 * dash-to-axle, cab-rearward greenhouse, low roofline, hard shoulder crease,
 * wide haunches with a narrower cabin (tumblehome).
 *
 * The body is two extrusions rather than one, which is what produces the
 * tumblehome: the lower body is extruded to full track width, the greenhouse
 * to a narrower width, so the shoulder steps in the way a real car's does.
 */

/**
 * Proportions matter more than detail. A real saloon is ~4.72 m long, 1.42 m
 * tall, on 0.68 m wheels — wheels just under half the car's height. Getting
 * that ratio wrong is what makes a procedural car read as a toy.
 */
const WHEEL_R = 0.365;
const AXLE_Y = 0.34;
const SILL_Y = 0.28;
const FRONT_AXLE = -1.46;
const REAR_AXLE = 1.5;
const ARCH_R = 0.4;

/**
 * The full side silhouette in one closed path. The wheel arches are cut into
 * the lower edge as open arcs rather than punched as circles — a circular hole
 * of any useful size severs the body, which is exactly what a car's arch must
 * not do.
 */
function bodyShape() {
  const s = new THREE.Shape();

  // Nose and bonnet, front to cowl
  s.moveTo(-2.24, SILL_Y);
  s.lineTo(-2.36, 0.46);
  s.lineTo(-2.34, 0.72);
  s.lineTo(-2.2, 0.815); // bonnet leading edge
  s.quadraticCurveTo(-1.78, 0.865, -1.32, 0.9);
  s.lineTo(-1.0, 0.955);

  // The beltline runs dead straight — this single line is the car's character
  s.lineTo(1.2, 0.985);

  // Boot and rear fascia
  s.lineTo(1.72, 0.99);
  s.quadraticCurveTo(2.06, 0.965, 2.24, 0.9); // boot lid, dropping away
  s.lineTo(2.32, 0.78); // hard rear edge — the lip, not a curve
  s.lineTo(2.34, 0.5);
  s.lineTo(2.24, SILL_Y);

  // Underside, rear to front, arcing over each wheel
  s.lineTo(REAR_AXLE + ARCH_R, SILL_Y);
  s.lineTo(REAR_AXLE + ARCH_R, AXLE_Y);
  s.absarc(REAR_AXLE, AXLE_Y, ARCH_R, 0, Math.PI, false);
  s.lineTo(REAR_AXLE - ARCH_R, SILL_Y);
  s.lineTo(FRONT_AXLE + ARCH_R, SILL_Y);
  s.lineTo(FRONT_AXLE + ARCH_R, AXLE_Y);
  s.absarc(FRONT_AXLE, AXLE_Y, ARCH_R, 0, Math.PI, false);
  s.lineTo(FRONT_AXLE - ARCH_R, SILL_Y);
  s.closePath();

  return s;
}

/** Cab-rearward greenhouse with a fast C-pillar. */
function greenhouseShape() {
  const s = new THREE.Shape();
  s.moveTo(-1.04, 0.94);
  s.quadraticCurveTo(-0.66, 1.26, -0.24, 1.375);
  s.lineTo(0.46, 1.415);
  s.quadraticCurveTo(1.14, 1.402, 1.44, 1.19);
  s.lineTo(1.78, 0.99); // backlight rake
  s.lineTo(1.78, 0.94);
  s.closePath();
  return s;
}

const extrude = (shape: THREE.Shape, depth: number, bevel: number) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  }).translate(0, 0, -depth / 2);

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, AXLE_Y, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.25, 48]} />
        <meshStandardMaterial color="#0A0B0D" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Rim face — sits proud of the tyre so it catches the key light */}
      <mesh position={[0, z > 0 ? 0.128 : -0.128, 0]}>
        <cylinderGeometry args={[0.262, 0.262, 0.03, 48]} />
        <meshStandardMaterial color="#C9D2DC" roughness={0.22} metalness={1} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, z > 0 ? 0.112 : -0.112, 0]}
          rotation={[0, 0, (i / 10) * Math.PI * 2]}
        >
          <boxGeometry args={[0.036, 0.042, 0.47]} />
          <meshStandardMaterial color="#DCE4EC" roughness={0.18} metalness={1} />
        </mesh>
      ))}
      <mesh position={[0, z > 0 ? 0.132 : -0.132, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.032, 24]} />
        <meshStandardMaterial color="#0E1116" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
}

export default function Sedan() {
  const group = useRef<THREE.Group>(null);
  const paint = useRef<THREE.MeshPhysicalMaterial>(null);
  const droplets = useRef<THREE.Points>(null);
  const dropMat = useRef<THREE.PointsMaterial>(null);
  const headlamp = useRef<THREE.MeshStandardMaterial>(null);
  const taillamp = useRef<THREE.MeshStandardMaterial>(null);

  const geo = useMemo(
    () => ({
      body: extrude(bodyShape(), 1.7, 0.035),
      cabin: extrude(greenhouseShape(), 1.54, 0.022),
      glass: extrude(greenhouseShape(), 1.575, 0.012).scale(0.985, 0.975, 1),
    }),
    [],
  );

  /** Droplets scattered on a shell around the body. */
  const dropGeo = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = THREE.MathUtils.randFloat(-2.2, 2.2);
      const top = Math.abs(x) < 1.5 ? 1.42 : 0.98;
      const y = THREE.MathUtils.randFloat(SILL_Y, top);
      const z = (Math.random() > 0.5 ? 1 : -1) * THREE.MathUtils.randFloat(0.2, 0.92);
      pos.set([x, y, Math.random() > 0.72 ? THREE.MathUtils.randFloat(-0.8, 0.8) : z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const scratch = useMemo(
    () => ({ dirty: new THREE.Color('#4E4C45'), base: new THREE.Color(), out: new THREE.Color() }),
    [],
  );

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = frame.carRotYSmooth;
      // A breath of suspension movement so the car never feels like a static prop.
      const idle = journey.reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.6) * 0.004;
      group.current.position.y = idle;
    }

    if (paint.current) {
      const plan = journey.hoveredPlan >= 0 ? plans[journey.hoveredPlan] : null;
      scratch.base.set(plan ? plan.paint.body : '#131A24');
      scratch.out.copy(scratch.base).lerp(scratch.dirty, frame.dirt * 0.62);

      paint.current.color.lerp(scratch.out, 0.08);
      paint.current.roughness = THREE.MathUtils.lerp(0.16, 0.68, frame.dirt);
      paint.current.clearcoat = THREE.MathUtils.lerp(
        plan ? plan.paint.clearcoat : 1,
        0.25,
        frame.dirt,
      );
      paint.current.clearcoatRoughness = THREE.MathUtils.lerp(0.03, 0.55, frame.dirt);
      paint.current.envMapIntensity = THREE.MathUtils.lerp(0.35, 1.9, 1 - frame.dirt);
    }

    if (dropMat.current) {
      dropMat.current.opacity = frame.wet * 0.85;
      dropMat.current.size = 0.012 + frame.wet * 0.016;
    }
    if (droplets.current) droplets.current.visible = frame.wet > 0.02;

    if (headlamp.current) headlamp.current.emissiveIntensity = 1.4 + frame.accent * 2.6;
    if (taillamp.current) taillamp.current.emissiveIntensity = 1.1 + frame.accent * 1.8;
  });

  return (
    <group ref={group} name="sedan">
      {/* Lower body */}
      <mesh geometry={geo.body} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={paint}
          color="#131A24"
          metalness={0.82}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={1.8}
        />
      </mesh>

      {/* Greenhouse — narrower extrusion is what creates the tumblehome */}
      <mesh geometry={geo.cabin} castShadow>
        <meshPhysicalMaterial
          color="#080C11"
          metalness={0.7}
          roughness={0.42}
          envMapIntensity={0.55}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Glazing, flush-mounted and slightly proud of the pillars */}
      <mesh geometry={geo.glass}>
        <meshPhysicalMaterial
          color="#05080C"
          metalness={0.1}
          roughness={0.06}
          transmission={0.55}
          thickness={0.35}
          ior={1.45}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Hard shoulder crease — a single line down the flank, both sides */}
      {[0.85, -0.85].map((z) => (
        <mesh key={z} position={[0.16, 0.845, z]}>
          <boxGeometry args={[3.1, 0.022, 0.03]} />
          <meshStandardMaterial color="#05070A" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* Sill blades */}
      {[0.88, -0.88].map((z) => (
        <mesh key={z} position={[0.05, 0.3, z]}>
          <boxGeometry args={[2.72, 0.06, 0.05]} />
          <meshStandardMaterial color="#080A0E" roughness={0.55} metalness={0.4} />
        </mesh>
      ))}

      {/* Grille */}
      <mesh position={[-2.28, 0.6, 0]}>
        <boxGeometry args={[0.1, 0.3, 1.02]} />
        <meshStandardMaterial color="#04060A" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Front LED signature */}
      {[0.62, -0.62].map((z) => (
        <mesh key={z} position={[-2.28, 0.79, z]}>
          <boxGeometry args={[0.06, 0.075, 0.44]} />
          <meshStandardMaterial
            ref={z > 0 ? headlamp : undefined}
            color="#EAF4FF"
            emissive="#CFE6FF"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Full-width rear light bar */}
      <mesh position={[2.3, 0.81, 0]}>
        <boxGeometry args={[0.05, 0.075, 1.62]} />
        <meshStandardMaterial
          ref={taillamp}
          color="#3A0A0E"
          emissive="#FF2D3A"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Mirrors */}
      {[0.94, -0.94].map((z) => (
        <mesh key={z} position={[-0.88, 1.0, z]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.24, 0.075, 0.13]} />
          <meshStandardMaterial color="#0A0D12" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Arch lips — the trim ring that turns a hole into a wheel arch */}
      {[FRONT_AXLE, REAR_AXLE].map((x) =>
        [0.845, -0.845].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, AXLE_Y, z]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[ARCH_R - 0.01, 0.022, 8, 28, Math.PI]} />
            <meshStandardMaterial color="#05070A" roughness={0.65} metalness={0.3} />
          </mesh>
        )),
      )}

      <Wheel x={FRONT_AXLE} z={0.83} />
      {/* Arch lips — the trim ring that turns a hole into a wheel arch */}
      {[FRONT_AXLE, REAR_AXLE].map((x) =>
        [0.845, -0.845].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, AXLE_Y, z]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[ARCH_R - 0.01, 0.022, 8, 28, Math.PI]} />
            <meshStandardMaterial color="#05070A" roughness={0.65} metalness={0.3} />
          </mesh>
        )),
      )}

      <Wheel x={FRONT_AXLE} z={-0.83} />
      <Wheel x={REAR_AXLE} z={0.83} />
      <Wheel x={REAR_AXLE} z={-0.83} />

      <points ref={droplets} geometry={dropGeo}>
        <pointsMaterial
          ref={dropMat}
          size={0.018}
          color="#CFF3FF"
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </group>
  );
}
