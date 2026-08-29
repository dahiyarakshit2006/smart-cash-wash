'use client';

import { Reveal, StageHeading } from '@/components/ui/Chrome';

const capabilities = [
  ['Verified workers', 'Police-verified, uniformed, on a named roster'],
  ['Digital attendance', 'Shift logged at the gate, visible to the RWA'],
  ['Dedicated supervisor', 'One per cluster, on the ground every morning'],
  ['Backup workforce', 'Absence covered the same day, not next week'],
  ['Standardised SOP', 'One written method every worker is trained on'],
];

/** What the RWA actually receives when it signs — concrete, not modelled. */
function Deliverables() {
  const items = [
    { label: 'Named supervisor', detail: 'One person, on the ground every morning, accountable to your RWA' },
    { label: 'Fixed roster', detail: 'The same workers, on file with the RWA, not a rotating crew' },
    { label: 'Same-morning cover', detail: 'Absence replaced before the first car arrives, not next week' },
    { label: 'Written SOP', detail: 'One documented method, handed to your committee, every worker trained on it' },
    { label: 'Verified workforce', detail: 'Police-verified, uniformed, badge-checked at the gate' },
  ];
  return (
    <div className="card p-8 sm:p-10">
      {items.map((it, i) => (
        <div key={it.label}>
          <Reveal delay={i * 0.1}>
            <div className="flex items-start gap-4">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-widest2 text-chalk">
                  {it.label}
                </p>
                <p className="mt-1 text-sm text-muted">{it.detail}</p>
              </div>
            </div>
          </Reveal>
          {i < items.length - 1 && (
            <div className="my-5 border-t border-line/60" aria-hidden="true" />
          )}
        </div>
      ))}
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

        <Deliverables />
      </div>
    </section>
  );
}
