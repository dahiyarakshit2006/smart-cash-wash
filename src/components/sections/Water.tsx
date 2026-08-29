'use client';

import { useMemo, useState } from 'react';
import { Reveal, StageHeading } from '@/components/ui/Chrome';
import { methods, calculatorDefaults, disclaimer } from '@/config/water';

const mid = ([a, b]: [number, number]) => (a + b) / 2;
const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        <span className="font-mono text-sm text-chalk">
          {value}
          <span className="text-muted"> {suffix}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
      />
    </label>
  );
}

export default function Water() {
  const [washes, setWashes] = useState(calculatorDefaults.washesPerMonth);
  const [waterlessShare, setWaterlessShare] = useState(
    Math.round(calculatorDefaults.mix.waterless * 100),
  );

  const model = useMemo(() => {
    const traditionalShare = calculatorDefaults.mix.traditional;
    const wl = waterlessShare / 100;
    const lw = Math.max(0, 1 - wl - traditionalShare);

    const perWash =
      wl * mid(methods[2].litres) + lw * mid(methods[1].litres) + traditionalShare * mid(methods[0].litres);
    const ours = washes * perWash;
    const baseline = washes * mid(methods[0].litres);

    return {
      ours,
      baseline,
      saved: baseline - ours,
      reduction: baseline > 0 ? (1 - ours / baseline) * 100 : 0,
      lowWaterShare: Math.round(lw * 100),
    };
  }, [washes, waterlessShare]);

  return (
    <section id="water" data-journey="water" className="stage stage-grow relative">
      <div className="shell grid w-full items-center gap-14 py-28 lg:grid-cols-2">
        <div>
          <Reveal>
            <StageHeading index={3} label="Water management" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="display-sm max-w-[13ch]">Clean doesn&apos;t have to mean wasteful.</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede mt-7">
              The method is chosen by how dirty the car actually is, not by habit. Light dust —
              which is most days — is lifted into microfibre with an encapsulating solution.
              Normal road dirt gets a metered low-water wash. Heavy contamination still gets a
              controlled rinse, because paint safety outranks the water number.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <ul className="mt-10 space-y-px overflow-hidden rounded-xl border border-line bg-line">
              {methods.map((m) => (
                <li key={m.id} className="bg-ink/80 p-5 backdrop-blur-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p
                      className={`font-mono text-[0.66rem] uppercase tracking-widest2 ${
                        m.id === 'traditional' ? 'text-sodium' : 'text-accent'
                      }`}
                    >
                      {m.label}
                    </p>
                    <p className="font-mono text-sm text-chalk">
                      {m.litres[0]}–{m.litres[1]}
                      <span className="text-muted"> L / wash</span>
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {m.appliesTo} · {m.note}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="card p-7 sm:p-9">
            <p className="eyebrow">Model your car</p>

            <div className="mt-7 space-y-7">
              <Slider label="Washes per month" value={washes} min={4} max={30} suffix="/ month" onChange={setWashes} />
              <Slider
                label="Handled waterless"
                value={waterlessShare}
                min={0}
                max={90}
                suffix="%"
                onChange={setWaterlessShare}
              />
              <p className="font-mono text-[0.62rem] uppercase tracking-widest2 text-muted">
                Remainder: {model.lowWaterShare}% low-water · 7% controlled rinse
              </p>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
              <div className="bg-ink p-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest2 text-sodium">
                  Hose baseline
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold tracking-tightest text-muted">
                  {fmt(model.baseline)} L
                </p>
              </div>
              <div className="bg-ink p-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest2 text-accent">
                  Our method mix
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold tracking-tightest text-chalk">
                  {fmt(model.ours)} L
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/[0.06] p-5">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest2 text-accent">
                Modelled water avoided
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-tightest text-chalk">
                {fmt(model.saved)} L
                <span className="ml-3 font-mono text-sm font-normal tracking-normal text-accent">
                  −{Math.round(model.reduction)}%
                </span>
              </p>
              <p className="mt-2 text-xs text-muted">
                per month · for your car · across {washes} washes
              </p>
            </div>

            <p className="mt-6 border-t border-line pt-5 text-[0.7rem] leading-relaxed text-muted">
              {disclaimer}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
