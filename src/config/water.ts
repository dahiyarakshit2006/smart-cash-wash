/**
 * WATER — every number the water section shows comes from here.
 *
 * These are configurable ASSUMPTIONS, not measured claims. The section is
 * written so the page never asserts an absolute saving; it states the
 * assumption, shows the arithmetic, and labels it as a model.
 */

export type WashMethod = {
  id: 'traditional' | 'lowwater' | 'waterless';
  label: string;
  /** Litres per wash — expressed as a range so nothing is overstated. */
  litres: [number, number];
  appliesTo: string;
  note: string;
};

export const methods: WashMethod[] = [
  {
    id: 'traditional',
    label: 'Traditional hose wash',
    litres: [40, 60],
    appliesTo: 'The current default in most societies',
    note: 'Open hose, uncontrolled flow, no measurement.',
  },
  {
    id: 'lowwater',
    label: 'Controlled low-water',
    litres: [8, 14],
    appliesTo: 'Normal road dirt',
    note: 'Metered buckets, pre-soak, two-bucket wash, rinseless chemistry.',
  },
  {
    id: 'waterless',
    label: 'Waterless maintenance',
    litres: [0.3, 0.8],
    appliesTo: 'Light dust — the majority of daily washes',
    note: 'Encapsulating solution lifts dust into microfibre. Only safe below a dust threshold.',
  },
];

/** Defaults for the interactive calculator. All user-adjustable on the page. */
export const calculatorDefaults = {
  cars: 300,
  washesPerCarPerMonth: 22,
  /** Share of washes handled by each method under our SOP. Must sum to 1. */
  mix: { waterless: 0.6, lowwater: 0.33, traditional: 0.07 },
};

export const disclaimer =
  'A model, not a measurement. Figures are per-wash assumptions we will replace with metered pilot data. Heavier contamination is always escalated to a controlled rinse — paint safety outranks the water number.';
