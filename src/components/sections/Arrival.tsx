'use client';

import { Reveal, StageHeading } from '@/components/ui/Chrome';

const capabilities = [
  ['Verified workers', 'Police-verified, uniformed, on a named roster'],
  ['Digital attendance', 'Shift logged at the gate, visible to the RWA'],
  ['Dedicated supervisor', 'One per cluster, on the ground every morning'],
  ['Backup workforce', 'Absence covered the same day, not next week'],
  ['Standardised SOP', 'One written method every worker is trained on'],
];

/** The ratio is the whole business model, so it gets its own visual moment. */
function RatioLadder() {
  const rungs = [
    { value: '300', unit: 'cars', note: 'across a hyperlocal cluster of nearby societies' },
    { value: '6', unit: 'trained professionals', note: 'at a validated worker-to-car ratio' },
    { value: '1', unit: 'supervised system', note: 'one contract, one accountable operator' },
  ];
  return (
    <div className="card p-8 sm:p-10">
      {rungs.map((r, i) => (
        <div key={r.unit}>
          <Reveal delay={i * 0.12}>
            <div className="flex items-baseline gap-5">
              <span className="font-display text-5xl font-extrabold tracking-tightest text-chalk sm:text-6xl">
                {r.value}
              </span>
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-widest2 text-accent">
                  {r.unit}
                </p>
                <p className="mt-1 text-sm text-muted">{r.note}</p>
              </div>
            </div>
          </Reveal>
          {i < rungs.length - 1 && (
            <div className="my-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-10 w-px bg-gradient-to-b from-accent/50 to-transparent" />
              <span className="font-mono text-[0.6rem] tracking-widest2 text-muted">
                {i === 0 ? 'deployed as' : 'operated as'}
              </span>
            </div>
          )}
        </div>
      ))}
      <p className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
        The ratio shown is our working model. It is being validated in pilot and will be
        tuned per society by layout, service frequency and worker productivity — not
        assumed.
      </p>
    </div>
  );
}

export default function Arrival() {
  return (
    <section id="arrival" className="stage scrim relative">
      <div className="shell grid w-full items-center gap-14 py-28 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div>
          <Reveal>
            <StageHeading index={1} label="Arrival" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="display-sm max-w-[16ch]">
              Every car. Every resident. One organised system.
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede mt-7">
              We take responsibility for the entire car-washing operation of a society —
              recruitment, verification, training, equipment, method, supervision, cover,
              complaints and reporting. The RWA signs one contract instead of arbitrating
              between residents and individual washers.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {capabilities.map(([k, v]) => (
                <li key={k} className="bg-ink/80 p-5 backdrop-blur-sm">
                  <p className="font-mono text-[0.64rem] uppercase tracking-widest2 text-chalk">
                    {k}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{v}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <RatioLadder />
      </div>
    </section>
  );
}
