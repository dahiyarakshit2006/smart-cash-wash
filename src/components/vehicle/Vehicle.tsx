'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { frame } from '@/lib/frame';
import { journey } from '@/lib/journey';
import { plans } from '@/config/pricing';
import { vehicle } from '@/config/vehicle';
import Sedan from './Sedan';

/**
 * A real GLB, driven by the same timeline as the procedural car: the dirt,
 * wetness, plan colour and idle motion all apply identically, so swapping the
 * model changes how the car looks and nothing about how the page behaves.
 */
function LoadedVehicle({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);

  const clone = useMemo(() => scene.clone(true), [scene]);

  /** Find the materials that should behave like body paint. */
  const paintMaterials = useMemo(() => {
    const found: THREE.MeshStandardMaterial[] = [];
    const wanted = vehicle.paintMaterialNames.map((n) => n.toLowerCase());
    let largest: { mat: THREE.MeshStandardMaterial; area: number } | null = null;

    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat) return;
        if (wanted.length && wanted.includes((mat.name ?? '').toLowerCase())) {
          found.push(mat);
          return;
        }
        if (!wanted.length) {
          mesh.geometry.computeBoundingBox();
          const b = mesh.geometry.boundingBox;
          const area = b ? (b.max.x - b.min.x) * (b.max.y - b.min.y) : 0;
          if (!largest || area > largest.area) largest = { mat, area };
        }
      });
    });

    if (!found.length && largest) found.push((largest as { mat: THREE.MeshStandardMaterial }).mat);
    return found;
  }, [clone]);

  useEffect(() => {
    const { scale, rotationY, position } = vehicle.transform;
    clone.scale.setScalar(scale);
    clone.rotation.y = rotationY;
    clone.position.set(...position);
  }, [clone]);

  const scratch = useMemo(
    () => ({ dirty: new THREE.Color('#4E4C45'), base: new THREE.Color(), out: new THREE.Color() }),
    [],
  );

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = frame.carRotYSmooth;
      group.current.position.y = journey.reducedMotion
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.6) * 0.004;
    }

    const plan = journey.hoveredPlan >= 0 ? plans[journey.hoveredPlan] : null;
    scratch.base.set(plan ? plan.paint.body : '#131A24');
    scratch.out.copy(scratch.base).lerp(scratch.dirty, frame.dirt * 0.62);

    paintMaterials.forEach((m) => {
      m.color.lerp(scratch.out, 0.08);
      m.roughness = THREE.MathUtils.lerp(0.16, 0.68, frame.dirt);
      m.envMapIntensity = THREE.MathUtils.lerp(0.35, 1.9, 1 - frame.dirt);
    });
  });

  return (
    <group ref={group}>
      <primitive object={clone} />
    </group>
  );
}

export default function Vehicle() {
  if (!vehicle.modelUrl) return <Sedan />;
  return (
    <Suspense fallback={<Sedan />}>
      <LoadedVehicle url={vehicle.modelUrl} />
    </Suspense>
  );
}
