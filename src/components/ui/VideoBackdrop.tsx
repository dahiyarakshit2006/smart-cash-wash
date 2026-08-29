'use client';

import { useEffect, useRef, useState } from 'react';
import { journey } from '@/config/media';
import { useActiveJourneySection } from '@/lib/useActiveJourneySection';

const CROSSFADE_MS = 700;
const SCRIM = 'rgba(5, 7, 10, 0.72)';

/**
 * One fixed full-screen video layer behind the whole page — where the old
 * WebGL canvas sat. The clip swaps as the visitor scrolls through the
 * journey (see useActiveJourneySection), crossfading so the page reads as
 * one continuous take rather than a series of separate video boxes.
 *
 * Stacking order, bottom to top: video(s) -> scrim -> page content. The
 * whole thing sits at z-0; every section is position:relative with
 * z-index:10 (see .stage in globals.css), so content can never end up
 * underneath the scrim the way the old per-section ::before scrim once did.
 */
export default function VideoBackdrop() {
  const activeIndex = useActiveJourneySection();
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Don't render either mode until we know which one to use.
  if (reducedMotion === null) {
    return <div className="fixed inset-0 z-0 bg-ink" aria-hidden="true" />;
  }

  return reducedMotion ? (
    <ReducedMotionBackdrop index={activeIndex} />
  ) : (
    <CrossfadeBackdrop index={activeIndex} />
  );
}

/** No playback — just the current section's first frame, swapped instantly. */
function ReducedMotionBackdrop({ index }: { index: number }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-ink" aria-hidden="true">
      <video
        key={journey[index].video}
        src={journey[index].video}
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: SCRIM }} />
    </div>
  );
}

type Slot = 'A' | 'B';

function waitCanPlay(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (video.readyState >= 3) {
      resolve();
      return;
    }
    const onCanPlay = () => {
      video.removeEventListener('canplay', onCanPlay);
      resolve();
    };
    video.addEventListener('canplay', onCanPlay);
  });
}

function CrossfadeBackdrop({ index }: { index: number }) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const videoRefs: Record<Slot, React.RefObject<HTMLVideoElement>> = { A: refA, B: refB };

  const slotIndexRef = useRef<Record<Slot, number>>({ A: -1, B: -1 });
  const activeSlotRef = useRef<Slot>('A');
  const initializedRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeSlot, setActiveSlot] = useState<Slot>('A');

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  const preloadInto = (slot: Slot, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= journey.length) return;
    if (slotIndexRef.current[slot] === targetIndex) return;
    const video = videoRefs[slot].current;
    if (!video) return;
    video.pause();
    video.src = journey[targetIndex].video;
    slotIndexRef.current[slot] = targetIndex;
    video.load();
  };

  // Mount: play the first clip in slot A, preload the next clip into B —
  // never all ten at once.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const a = refA.current;
    if (!a) return;
    a.src = journey[index].video;
    slotIndexRef.current.A = index;
    a.load();
    a.play().catch(() => {});
    preloadInto('B', index + 1);
    // Runs once, at mount, against whatever the initial index is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active section changed: crossfade to its clip.
  useEffect(() => {
    if (!initializedRef.current) return;
    const currentSlot = activeSlotRef.current;
    if (slotIndexRef.current[currentSlot] === index) return;

    const hiddenSlot: Slot = currentSlot === 'A' ? 'B' : 'A';
    const hiddenVideo = videoRefs[hiddenSlot].current;
    if (!hiddenVideo) return;

    let cancelled = false;

    (async () => {
      preloadInto(hiddenSlot, index);
      await waitCanPlay(hiddenVideo);
      if (cancelled) return;

      hiddenVideo.currentTime = 0;
      hiddenVideo.play().catch(() => {});
      setActiveSlot(hiddenSlot);

      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        const settledHiddenSlot: Slot = hiddenSlot === 'A' ? 'B' : 'A';
        videoRefs[settledHiddenSlot].current?.pause();
        preloadInto(settledHiddenSlot, index + 1);
      }, CROSSFADE_MS);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-ink" aria-hidden="true">
      <video
        ref={refA}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: activeSlot === 'A' ? 1 : 0, transition: `opacity ${CROSSFADE_MS}ms ease-out` }}
      />
      <video
        ref={refB}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: activeSlot === 'B' ? 1 : 0, transition: `opacity ${CROSSFADE_MS}ms ease-out` }}
      />
      <div className="absolute inset-0" style={{ background: SCRIM }} />
    </div>
  );
}
