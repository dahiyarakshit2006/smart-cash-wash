'use client';

import { useEffect, useRef, useState } from 'react';
import { journey } from '@/config/media';

/**
 * The single source of truth for "where the visitor is" in the journey.
 * Watches every section carrying a data-journey attribute with one shared
 * IntersectionObserver, and reports the index (into journey.ts, in scroll
 * order) of whichever section currently sits across the viewport's vertical
 * centre line.
 *
 * Debounced by ~150ms: a fast scroll crosses several centre-line triggers
 * in a row, but only the last one survives the debounce, so the caller
 * (VideoBackdrop's crossfade, Nav's stage readout) settles once rather than
 * thrashing through every section in between.
 */
export function useActiveJourneySection() {
  const [index, setIndex] = useState(0);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const elements = journey
      .map((s) => document.querySelector<HTMLElement>(`[data-journey="${s.id}"]`))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const elementIndex = new Map(elements.map((el, i) => [el, i]));

    const commit = (next: number) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIndex(pendingRef.current), 150);
    };

    const observer = new IntersectionObserver(
      () => {
        const mid = window.innerHeight / 2;
        // Among sections crossing the centre line right now, the last one
        // in document order is the one most "current" for the visitor.
        let active: HTMLElement | undefined;
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= mid && rect.bottom >= mid) active = el;
        }
        if (active) commit(elementIndex.get(active)!);
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return index;
}
