'use client';

import { Reveal } from '@/components/ui/Chrome';
import { brand } from '@/config/brand';
import { plans, currency } from '@/config/pricing';

const startingPrice = Math.min(...plans.map((p) => p.price));

export function Hero() {
  return (
    <section id="top" data-journey="hero" className="stage relative">
      <div className="shell relative w-full pb-24 pt-32">
        <Reveal>
          <p className="eyebrow mb-7 text-sodium">{brand.region}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="display-caps max-w-[19ch]">
            Professionally managed car washing{' '}
            <span className="display-serif">for your society.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="display-sm mt-8 max-w-[22ch] text-chalk">
            One company. Verified workers. From {currency}
            {startingPrice}/month.
          </p>
        </Reveal>

        <Reveal delay={0.22}>
          <p className="lede mt-4 text-muted">
            The <span className="font-semibold text-chalk">alternative</span> to whoever
            currently washes your car in the basement.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#subscription" className="btn-primary">
              See plans
              <span aria-hidden="true">→</span>
            </a>
          </div>
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
    <section data-journey="transition" className="stage-auto">
      <div className="shell w-full">
        <div className="max-w-3xl">
          <Reveal>
            <h2 className="display-sm max-w-[19ch]">
              Your car gets washed every day.
              <br />
              <span className="text-muted">The system behind it is broken.</span>
            </h2>
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
