'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A looping background video for a single section. Plays only while the
 * section is substantially in view (IntersectionObserver, 25% threshold) so
 * ten sections never decode video simultaneously — that's what destroys
 * frame rate on a mid-range Android. Respects prefers-reduced-motion by
 * never starting playback, showing only the first frame.
 */
export default function SectionVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let loaded = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (reducedMotion) {
          // Load just the first frame lazily, on first entry — never play.
          if (entry.isIntersecting && !loaded) {
            loaded = true;
            video.preload = 'auto';
            video.load();
          }
          return;
        }
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    const section = video.closest('section');
    observer.observe(section ?? video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="none"
        className={`h-full w-full object-cover transition-opacity duration-[600ms] ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5, 7, 10, 0.72)' }}
      />
    </div>
  );
}
