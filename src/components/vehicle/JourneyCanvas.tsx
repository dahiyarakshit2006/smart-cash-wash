'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import { journey } from '@/lib/journey';

/**
 * One canvas, fixed behind the whole journey. Content scrolls over it; the
 * scene is driven entirely by scroll position, never by React state.
 */
export default function JourneyCanvas() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [visible, setVisible] = useState(true);
  const raf = useRef<number>();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < (Number(new URLSearchParams(location.search).get("lowq")) ? 99999 : 900);
    const cores = navigator.hardwareConcurrency ?? 4;
    try {
      const probe = document.createElement('canvas');
      const ctx =
        probe.getContext('webgl2') ||
        probe.getContext('webgl') ||
        probe.getContext('experimental-webgl');
      if (!ctx) setSupported(false);
    } catch {
      setSupported(false);
    }

    journey.reducedMotion = reduced;
    setQuality(small || cores <= 4 || reduced ? 'low' : 'high');
    setReady(true);

    const el = document.getElementById('journey');
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      journey.progress = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      journey.parked = rect.bottom < window.innerHeight * 0.5;
      setVisible(rect.top < window.innerHeight && rect.bottom > 0);
    };

    const loop = () => {
      measure();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!ready || !supported) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <Canvas
        shadows={quality === 'high'}
        dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
        camera={{ fov: 38, near: 0.1, far: 120, position: [5.2, 1.35, 6.4] }}
      >
        <Scene quality={quality} />
      </Canvas>
    </div>
  );
}
