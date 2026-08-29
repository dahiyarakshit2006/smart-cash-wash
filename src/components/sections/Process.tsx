'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Reveal, StageHeading } from '@/components/ui/Chrome';
import SectionVideo from '@/components/ui/SectionVideo';
import { sectionVideo } from '@/config/media';

const sop = [
  ['Pre-clean', 'Loose grit lifted before anything touches the paint. This is the step that prevents swirl marks, and the step individual washers skip.'],
  ['Solution', 'Encapsulating or low-water chemistry chosen by dirt level, applied panel by panel.'],
  ['Microfibre', 'Two-towel method, folded in eighths, never reused across panels.'],
  ['Wheels and tyres', 'Separate tools and separate buckets. Brake dust never reaches bodywork.'],
  ['Glass', 'Inside and out, streak-checked against the light.'],
  ['Controlled rinse', 'Only where contamination requires it. Litres logged either way.'],
];

const checks = [
  'Exterior cleaned',
  'Glass cleaned',
  'Wheels checked',
  'Mirrors checked',
  'Service recorded',
  'Quality approved',
];

function Wash() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.35'] });

  return (
    <section className="stage relative">
      <SectionVideo src={sectionVideo.wash} />
      <div className="shell w-full py-28" ref={ref}>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <Reveal>
              <StageHeading index={4} label="The wash" />
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="display-sm max-w-[12ch]">One method. Every car.</h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="lede mt-7">
                Every worker is trained on the same written sequence. No improvised methods, no
                dependence on one person&apos;s habits, no difference between the car washed on
                Monday and the car washed on Thursday.
              </p>
            </Reveal>
          </div>

          <ol className="relative">
            <span className="absolute left-[0.36rem] top-2 h-[calc(100%-1rem)] w-px bg-line" aria-hidden="true" />
            <motion.span
              className="absolute left-[0.36rem] top-2 w-px origin-top bg-accent"
              style={{ height: 'calc(100% - 1rem)', scaleY: scrollYProgress }}
              aria-hidden="true"
            />
            {sop.map(([title, body], i) => (
              <li key={title} className="relative pb-9 pl-9 last:pb-0">
                <Reveal delay={i * 0.06}>
                  <span
                    className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-accent/60 bg-ink"
                    aria-hidden="true"
                  />
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[0.62rem] tracking-widest2 text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-lg font-bold tracking-tight text-chalk">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">{body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Quality() {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <section className="stage relative">
      <SectionVideo src={sectionVideo.quality} />
      <div className="shell grid w-full items-center gap-14 py-28 lg:grid-cols-2">
        <div>
          <Reveal>
            <StageHeading index={5} label="Quality control" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="display-sm max-w-[15ch]">
              The wash isn&apos;t finished until the system says it is.
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede mt-7">
              A supervisor signs off, not the person who did the work. Every service is recorded
              against the vehicle, so a complaint is a lookup rather than an argument.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <span className="eyebrow text-chalk/70">Supervisor sign-off</span>
              <span className="eyebrow text-chalk/70">Digital service record</span>
              <span className="eyebrow text-chalk/70">24-hour re-wash guarantee</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <ul ref={ref} className="card divide-y divide-line p-2">
            {checks.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0.25 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.15 + i * 0.14, duration: 0.4 }}
                className="flex items-center gap-4 px-5 py-4"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ delay: 0.15 + i * 0.14, type: 'spring', stiffness: 320, damping: 18 }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[0.6rem] font-bold text-ink"
                  aria-hidden="true"
                >
                  ✓
                </motion.span>
                <span className="font-mono text-[0.72rem] uppercase tracking-widest2 text-chalk">
                  {c}
                </span>
              </motion.li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Drying() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section className="stage relative">
      <SectionVideo src={sectionVideo.drying} />
      <div className="shell w-full py-28 text-center" ref={ref}>
        <Reveal>
          <StageHeading index={6} label="Drying" />
        </Reveal>
        <motion.h2 style={{ x }} className="display mx-auto max-w-[10ch]">
          Clean. Dry. Ready.
        </motion.h2>
        <Reveal delay={0.14}>
          <p className="lede mx-auto mt-8 text-center">
            Forced air through the shuts and panel gaps, then microfibre. Water is removed, not
            left to spot in the sun.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Ready() {
  return (
    <section className="stage relative">
      <SectionVideo src={sectionVideo.ready} />
      <div className="shell w-full py-28">
        <Reveal>
          <StageHeading index={7} label="Ready" />
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="display max-w-[14ch]">Ready before your day begins.</h2>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[
              ['Washed', 'To the same standard as every other car in the society'],
              ['Checked', 'By a supervisor, before the vehicle is released'],
              ['Tracked', 'Timestamped against your registration'],
              ['Ready', 'Back in its slot before you leave for work'],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink/80 p-6 backdrop-blur-sm">
                <p className="font-mono text-[0.66rem] uppercase tracking-widest2 text-accent">{k}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">{v}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { Wash, Quality, Drying, Ready };
