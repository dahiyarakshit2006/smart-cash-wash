'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { brand, nav } from '@/config/brand';
import { journey } from '@/config/media';
import { useActiveJourneySection } from '@/lib/useActiveJourneySection';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`group inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-lg font-extrabold tracking-[0.18em] text-chalk">
        {brand.name}
      </span>
      {brand.suffix && (
        <span className="hidden font-mono text-[0.6rem] uppercase tracking-widest2 text-muted transition-colors group-hover:text-accent sm:inline">
          {brand.suffix}
        </span>
      )}
    </a>
  );
}

/** Reveals content once, on entry. Respects reduced motion via the CSS layer. */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px -12% 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stage numbering is used only where the content genuinely is a sequence —
 * a car physically moving through a process. Elsewhere on the page there
 * are no numbered markers.
 */
export function StageHeading({ index, label }: { index: number; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="font-mono text-[0.68rem] tracking-widest2 text-accent">
        {String(index).padStart(2, '0')}
      </span>
      <span className="h-px w-10 bg-accent/40" />
      <span className="eyebrow text-chalk/70">{label}</span>
    </div>
  );
}

/** Fixed chrome. The stage readout doubles as a progress indicator. */
export function Nav() {
  const [solid, setSolid] = useState(false);
  const activeIndex = useActiveJourneySection();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? 'border-b border-line bg-ink/70 backdrop-blur-xl' : ''
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Wordmark />

        <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[0.62rem] uppercase tracking-widest2 text-muted">
            {journey[activeIndex].label}
          </span>
        </div>

        <nav className="flex items-center gap-7">
          <ul className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="font-mono text-[0.66rem] uppercase tracking-widest2 text-muted transition-colors hover:text-chalk"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#onboard" className="btn-primary !px-5 !py-2.5">
            For societies
          </a>
        </nav>
      </div>
    </header>
  );
}
