/**
 * BRAND — swap the name here and it propagates everywhere
 * (nav, hero, footer, dashboard chrome, form, metadata).
 */
export const brand = {
  name: 'DHRUVA',
  /** Rendered smaller, after the wordmark. Set to '' to hide. */
  suffix: 'CAR CARE',
  tagline: 'A car-care operating system for residential societies.',
  /** Used in <title> and og description */
  metaTitle: 'DHRUVA — Car care infrastructure for residential societies',
  metaDescription:
    'We replace fragmented individual car washers with a professional, accountable, subscription-based and water-efficient car-care system inside residential societies across Delhi-NCR.',
  region: 'Delhi · Noida · Greater Noida · Gurgaon · Ghaziabad · Faridabad',
  email: 'societies@dhruva.example',
  phone: '+91 00000 00000',
} as const;

export const nav = [
  { label: 'The system', href: '#arrival' },
  { label: 'Plans', href: '#subscription' },
  { label: 'Water', href: '#water' },
] as const;
