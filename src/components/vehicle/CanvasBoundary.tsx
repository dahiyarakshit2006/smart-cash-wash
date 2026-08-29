'use client';

import { Component, type ReactNode } from 'react';

/**
 * WebGL is not guaranteed. Old hardware, locked-down corporate browsers and
 * software-rendering blocklists all fail to give us a context — and without a
 * boundary a failed canvas takes the entire page down with it.
 *
 * Everything the site needs to say is in the DOM. The 3D scene is the
 * atmosphere, not the argument, so losing it costs nothing but the mood.
 */
export default class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('3D scene unavailable, falling back to the flat page.', error);
    }
  }

  render() {
    if (this.state.failed) {
      // A quiet lit backdrop that keeps the mood without a renderer.
      return (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(70% 50% at 70% 45%, rgba(0,229,143,0.07), transparent 70%),' +
              'radial-gradient(90% 60% at 20% 20%, rgba(255,154,60,0.06), transparent 65%)',
          }}
        />
      );
    }
    return this.props.children;
  }
}
