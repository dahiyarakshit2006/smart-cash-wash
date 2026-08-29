'use client';

import { Reveal } from '@/components/ui/Chrome';
import { rwaBenefits, opsSociety, opsFeed, residentDemo } from '@/config/society';

export function Rwa() {
  return (
    <section id="rwa" className="relative z-10 border-t border-line bg-surface/40">
      <div className="shell py-28 sm:py-36">
        <Reveal>
          <p className="eyebrow">For resident welfare associations</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="display mt-6 max-w-[16ch]">
            One partner. One system. One accountable team.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {rwaBenefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.05}>
              <div className="h-full bg-ink p-7">
                <h3 className="font-display text-base font-bold tracking-tight text-chalk">
                  {b.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <a href="#onboard" className="btn-primary mt-12">
            Bring the system to your society
            <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-ink p-5">
      <p className="font-mono text-[0.58rem] uppercase tracking-widest2 text-muted">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-extrabold tracking-tightest ${
          accent ? 'text-accent' : 'text-chalk'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function Dashboards() {
  return (
    <section className="relative z-10 border-t border-line bg-ink">
      <div className="shell py-28 sm:py-36">
        <Reveal>
          <p className="eyebrow">Two views of the same operation</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="display-sm mt-6 max-w-[20ch]">
            Residents see their car. We see the whole cluster.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]">
          {/* Resident */}
          <Reveal>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="font-mono text-[0.6rem] uppercase tracking-widest2 text-muted">
                  My car
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest2 text-accent">
                    {residentDemo.status}
                  </span>
                </span>
              </div>
              <div className="p-6">
                <p className="font-display text-xl font-bold tracking-tight">{residentDemo.vehicle}</p>
                <p className="mt-1 font-mono text-[0.66rem] tracking-widest2 text-muted">
                  {residentDemo.parking}
                </p>

                <dl className="mt-7 space-y-4 border-t border-line pt-6 text-sm">
                  {[
                    ['Last service', residentDemo.lastService],
                    ['Next scheduled', residentDemo.nextScheduled],
                    ['Plan', residentDemo.plan],
                    ['Washes this month', String(residentDemo.washesThisMonth)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4">
                      <dt className="font-mono text-[0.62rem] uppercase tracking-widest2 text-muted">
                        {k}
                      </dt>
                      <dd className="text-right text-sm text-chalk">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 flex gap-2">
                  <span className="btn-ghost !px-4 !py-2 !text-[0.6rem]">Add-ons</span>
                  <span className="btn-ghost !px-4 !py-2 !text-[0.6rem]">Report an issue</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Operations */}
          <Reveal delay={0.12}>
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-widest2 text-chalk">
                  {opsSociety.name}
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-widest2 text-muted">
                  {opsSociety.societies} societies · one route
                </span>
              </div>

              <div className="grid gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
                <Metric label="Cars" value={String(opsSociety.cars)} />
                <Metric label="Active subscriptions" value={String(opsSociety.activeSubscriptions)} />
                <Metric label="Workers on shift" value={String(opsSociety.workers)} />
                <Metric label="Washes today" value={String(opsSociety.washesToday)} />
                <Metric label="Worker utilisation" value={`${opsSociety.routeUtilisation}%`} accent />
                <Metric label="Open complaints" value={String(opsSociety.openComplaints)} />
                <Metric label="Satisfaction" value={`${opsSociety.satisfaction}%`} />
                <Metric label="Water today" value={`${opsSociety.waterTodayLitres.toLocaleString('en-IN')} L`} />
              </div>

              <ul className="divide-y divide-line border-t border-line">
                {opsFeed.map((f) => (
                  <li key={f.time} className="flex gap-5 px-5 py-3">
                    <span className="font-mono text-[0.66rem] text-accent">{f.time}</span>
                    <span className="text-xs text-muted">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <p className="mt-10 max-w-[62ch] text-xs leading-relaxed text-muted">
            Worker utilisation sits at the top of this dashboard on purpose. It is the metric the
            business lives or dies on — a single society cannot fill a worker&apos;s day, which is
            why we contract nearby societies as one route from the start.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
