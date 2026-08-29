'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Reveal } from '@/components/ui/Chrome';
import SectionVideo from '@/components/ui/SectionVideo';
import { futureServices } from '@/config/society';
import { sectionVideo } from '@/config/media';

/** One car becomes a society becomes a cluster. The zoom-out, in markup. */
function Swarm() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const cells = Array.from({ length: 180 });

  return (
    <div ref={ref} className="relative">
      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 sm:gap-2">
        {cells.map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={inView ? { opacity: i === 0 ? 1 : 0.28, scaleY: 1 } : {}}
            transition={{
              delay: i === 0 ? 0 : 0.35 + (i / cells.length) * 1.4,
              duration: 0.5,
              ease: 'easeOut',
            }}
            className={`h-2.5 rounded-[2px] sm:h-3 ${i === 0 ? 'bg-accent' : 'bg-chalk'}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="eyebrow mt-6">
        <span className="text-accent">One car</span> · one society · one hyperlocal cluster
      </p>
    </div>
  );
}

export default function Platform() {
  return (
    <section className="relative isolate z-10 border-t border-line bg-ink">
      <SectionVideo src={sectionVideo.platform} />
      <div className="shell py-28 sm:py-36">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal>
              <h2 className="display max-w-[12ch]">One car is the beginning.</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="lede mt-8">
                We start with the one automotive service that recurs every single week. Once a
                cluster of societies trusts us with that, the harder, higher-value services
                already have a customer relationship and a route to reach them.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <p className="display-sm mt-10 max-w-[16ch] text-muted">
                We are building the infrastructure for residential car care.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.14}>
            <Swarm />
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-24">
            <p className="eyebrow">What the relationship unlocks</p>
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {futureServices.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-line px-4 py-2 font-mono text-[0.66rem] uppercase tracking-widest2 text-muted transition-colors hover:border-accent/50 hover:text-chalk"
                >
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-7 max-w-[60ch] text-xs leading-relaxed text-muted">
              Sequenced deliberately. Nothing above ships until recurring washing is proven on
              cost per car, worker utilisation and churn in a live cluster.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
