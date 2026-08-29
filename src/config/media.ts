/**
 * MEDIA — single source of truth for which video plays behind each section.
 *
 * Filenames match what's actually in public/video/ exactly, including the
 * original typos (standoing, claing, claeaning) — do not "correct" them,
 * the files on disk are spelled this way.
 */
export const sectionVideo = {
  hero: '/video/standoing-car-clip.mp4',
  transition: '/video/no-human-cleaning.mp4',
  arrival: '/video/hands-moving.mp4',
  subscription: '/video/cleaning.mp4',
  water: '/video/water-spray.mp4',
  wash: '/video/car-soap.mp4',
  quality: '/video/brush-deep-claing.mp4',
  drying: '/video/deep-claeaning.mp4',
  ready: '/video/final-result.mp4',
  platform: '/video/interior-cleaning.mp4',
} as const;
