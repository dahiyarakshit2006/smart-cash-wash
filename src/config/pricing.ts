/**
 * PRICING — the only place plan pricing lives.
 *
 * NOTE ON UNIT ECONOMICS: modelled cost-per-car sits at roughly ₹750–870/month
 * at full cluster utilisation and ₹1,100–1,800/month standalone. The Basic tier
 * below therefore prices under cost. Left as specified, but changing a number
 * here is the entire edit — the cards, the comparison rows and the CTA copy all
 * read from this array.
 */

export type Plan = {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  price: number;
  cadence: string;
  summary: string;
  /** Drives the paint + lighting treatment on the 3D vehicle when hovered. */
  paint: { body: string; rim: string; clearcoat: number };
  includes: string[];
  featured?: boolean;
};

export const currency = '₹';

export const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 499,
    cadence: '/month',
    summary: 'Regular exterior maintenance wash.',
    paint: { body: '#20262F', rim: '#8B94A0', clearcoat: 0.6 },
    includes: [
      'Exterior maintenance wash',
      'Glass and mirrors',
      'Wheels and tyres',
      'Assigned worker and backup cover',
      'Complaint resolution within 24 hours',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 649,
    cadence: '/month',
    summary: 'Exterior plus periodic additional cleaning.',
    paint: { body: '#12212B', rim: '#B8C2CE', clearcoat: 0.85 },
    includes: [
      'Everything in Basic',
      'Periodic interior vacuum',
      'Dashboard and console wipe-down',
      'Door jambs and sills',
      'Monthly service report',
    ],
    featured: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 999,
    cadence: '/month',
    summary: 'Enhanced cleaning with detailing benefits.',
    paint: { body: '#080C12', rim: '#E6EDF5', clearcoat: 1 },
    includes: [
      'Everything in Standard',
      'Quarterly paint decontamination',
      'Tyre dressing and trim restoration',
      'Priority scheduling',
      'Discounted detailing and coating',
    ],
  },
];

/** Add-ons billed per service, not per month. */
export const addOns = [
  { name: 'Interior deep clean', from: 899 },
  { name: 'Machine polish', from: 2499 },
  { name: 'Ceramic coating', from: 8999 },
  { name: 'Pre-monsoon underbody', from: 1499 },
];
