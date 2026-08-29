'use client';

import { useState } from 'react';
import { Reveal, StageHeading } from '@/components/ui/Chrome';
import SectionVideo from '@/components/ui/SectionVideo';
import { plans, addOns, currency } from '@/config/pricing';
import { sectionVideo } from '@/config/media';

export default function Subscription() {
  const [active, setActive] = useState(-1);

  const focus = (i: number) => setActive(i);
  const blur = () => setActive(-1);

  return (
    <section id="subscription" className="stage relative">
      <SectionVideo src={sectionVideo.subscription} />
      <div className="shell w-full py-28">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-end">
          <div>
            <Reveal>
              <StageHeading index={2} label="Subscription" />
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="display-sm max-w-[14ch]">
                Your car deserves more than a handshake agreement.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="lede mt-7">
                One subscription. No chasing workers, no renegotiating every month, no cash
                handed over in a basement. Billing, history and complaints all sit in one
                place.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="grid gap-4 sm:grid-cols-3" onMouseLeave={blur}>
              {plans.map((p, i) => {
                const on = active === i;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseEnter={() => focus(i)}
                    onFocus={() => focus(i)}
                    onBlur={blur}
                    aria-pressed={on}
                    className={`card group relative flex flex-col p-6 text-left transition-all duration-500 ${
                      on ? 'border-accent/60 bg-surface' : 'hover:border-line'
                    }`}
                  >
                    {p.featured && (
                      <span className="absolute right-5 top-5 font-mono text-[0.55rem] uppercase tracking-widest2 text-accent">
                        Most taken
                      </span>
                    )}
                    <p className="font-mono text-[0.66rem] uppercase tracking-widest2 text-muted">
                      {p.name}
                    </p>
                    <p className="mt-5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-extrabold tracking-tightest">
                        {currency}
                        {p.price}
                      </span>
                      <span className="font-mono text-xs text-muted">{p.cadence}</span>
                    </p>
                    <p className="mt-3 text-sm text-muted">{p.summary}</p>
                    <ul className="mt-6 space-y-2 border-t border-line pt-5">
                      {p.includes.map((f) => (
                        <li key={f} className="flex gap-2.5 text-xs leading-relaxed text-muted">
                          <span
                            className={`mt-1 h-1 w-1 shrink-0 rounded-full transition-colors ${
                              on ? 'bg-accent' : 'bg-muted/50'
                            }`}
                            aria-hidden="true"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-6 font-mono text-[0.62rem] uppercase tracking-widest2 transition-colors ${
                        on ? 'text-accent' : 'text-muted'
                      }`}
                    >
                      {on ? 'Selected' : 'Select this plan'} →
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-8">
            <span className="eyebrow">Billed per service</span>
            {addOns.map((a) => (
              <span key={a.name} className="text-xs text-muted">
                {a.name}{' '}
                <span className="font-mono text-chalk">
                  from {currency}
                  {a.from.toLocaleString('en-IN')}
                </span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
