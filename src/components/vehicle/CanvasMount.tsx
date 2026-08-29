'use client';

import dynamic from 'next/dynamic';
import CanvasBoundary from './CanvasBoundary';

/** WebGL is client-only, so the canvas is mounted here rather than in the page. */
const JourneyCanvas = dynamic(() => import('./JourneyCanvas'), { ssr: false });

export default function CanvasMount() {
  return (
    <CanvasBoundary>
      <JourneyCanvas />
    </CanvasBoundary>
  );
}
