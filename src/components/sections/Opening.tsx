'use client';

import { Reveal } from '@/components/ui/Chrome';
import { brand } from '@/config/brand';

const failures = [
  { k: 'Unorganised labour', v: 'No employer, no roster, no cover when someone stops coming.' },
  { k: 'Inconsistent quality', v: 'Every washer has their own method. Nobody has written one down.' },
  { k: 'Uncontrolled water', v: 'An open hose, no measurement, no one accountable for the total.' },
  { k: 'No accountability', v: 'When it goes wrong, there is no company to call — only a person.' },
];

export function Hero() {
  return (
    <section id="top" data-journey="hero" className="stage relative">
      <div className="shell relative w-full pb-24 pt-32">
        <Reveal>
          <p className="eyebrow mb-7 text-sodium">{brand.region}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="display max-w-[19ch]">
            Your car gets washed every day.
            <br />
            <span className="text-muted">The system behind it is broken.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="lede mt-8">
            Thousands of residential societies across Delhi-NCR run on car washing that no
            company owns. The demand is already there. The infrastructure is not.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#arrival" className="btn-primary">
              Experience the system
              <span aria-hidden="true">→</span>
            </a>
            <a href="#onboard" className="btn-ghost">
              Bring it to your society
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.34}>
          <dl className="mt-20 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {failures.map((f) => (
              <div key={f.k} className="bg-ink/80 p-6 backdrop-blur-sm">
                <dt className="font-mono text-[0.66rem] uppercase tracking-widest2 text-sodium">
                  {f.k}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.46}>
          <p className="eyebrow mt-14 flex items-center gap-3">
            <span className="inline-block h-8 w-px animate-pulse bg-line" aria-hidden="true" />
            Scroll to see the system
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Transition() {
  return (
    <section data-journey="transition" className="stage relative">
      <div className="shell w-full">
        <div className="max-w-3xl">
          <Reveal>
            <h2 className="display-sm">So we rebuilt the experience.</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="display-sm mt-6 text-muted">
              From individual washers to an organised car-care system.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
              {['One contract', 'One roster', 'One escalation path', 'One water log'].map((t) => (
                <span key={t} className="eyebrow text-chalk/70">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
