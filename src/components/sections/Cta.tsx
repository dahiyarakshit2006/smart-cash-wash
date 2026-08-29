'use client';

import { useState } from 'react';
import { Reveal } from '@/components/ui/Chrome';
import { brand } from '@/config/brand';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Cta() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.name || !data.society || !data.phone) {
      setError('Name, society and phone are needed before we can call you back.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setError('');
    try {
      // Point this at your CRM, WhatsApp Business webhook or Google Sheet endpoint.
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
      setError(
        `We couldn't send that. Call ${brand.phone} or email ${brand.email} and we'll pick it up from there.`,
      );
    }
  }

  return (
    <section id="onboard" className="relative z-10 border-t border-line bg-surface/40">
      <div className="shell py-28 sm:py-36">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <div>
            <Reveal>
              <h2 className="display max-w-[15ch]">
                The future of car washing isn&apos;t another washer.
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="display mt-4 text-accent">It&apos;s a system.</p>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="lede mt-8">
                We are onboarding a first cluster of societies in Delhi-NCR. If your committee is
                tired of managing individual washers, we&apos;ll walk your parking, count the
                cars and put a proposal in front of you.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 space-y-2">
                <p className="font-mono text-[0.68rem] uppercase tracking-widest2 text-muted">
                  {brand.email}
                </p>
                <p className="font-mono text-[0.68rem] uppercase tracking-widest2 text-muted">
                  {brand.phone}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.16}>
            <form onSubmit={submit} className="card p-7 sm:p-9" noValidate>
              <p className="eyebrow">Society enquiry</p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="sr-only">Your name</span>
                  <input name="name" className="field" placeholder="Your name" autoComplete="name" required />
                </label>
                <label className="sm:col-span-2">
                  <span className="sr-only">Society name</span>
                  <input name="society" className="field" placeholder="Society name" required />
                </label>
                <label>
                  <span className="sr-only">City</span>
                  <input name="city" className="field" placeholder="City" autoComplete="address-level2" />
                </label>
                <label>
                  <span className="sr-only">Approximate number of cars</span>
                  <input
                    name="cars"
                    type="number"
                    min={1}
                    className="field"
                    placeholder="Approx. cars"
                  />
                </label>
                <label>
                  <span className="sr-only">Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    className="field"
                    placeholder="Phone"
                    autoComplete="tel"
                    required
                  />
                </label>
                <label>
                  <span className="sr-only">Email</span>
                  <input
                    name="email"
                    type="email"
                    className="field"
                    placeholder="Email"
                    autoComplete="email"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary mt-7 w-full justify-center disabled:opacity-60"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Request a site visit'}
              </button>

              <p aria-live="polite" className="mt-4 min-h-[1.25rem] text-xs">
                {status === 'sent' && (
                  <span className="text-accent">
                    Received. We&apos;ll call within two working days to arrange a parking walk-through.
                  </span>
                )}
                {status === 'error' && <span className="text-sodium">{error}</span>}
              </p>

              <p className="mt-4 border-t border-line pt-5 text-[0.7rem] leading-relaxed text-muted">
                We only use these details to respond to your enquiry.
              </p>
            </form>
          </Reveal>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-6 py-10">
          <div>
            <p className="font-display text-sm font-extrabold tracking-[0.18em]">{brand.name}</p>
            <p className="mt-2 max-w-[42ch] text-xs text-muted">{brand.tagline}</p>
          </div>
          <p className="font-mono text-[0.6rem] uppercase tracking-widest2 text-muted">
            {brand.region}
          </p>
        </div>
      </footer>
    </section>
  );
}
