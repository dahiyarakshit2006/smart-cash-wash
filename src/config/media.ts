/**
 * MEDIA — single source of truth for the journey's video sequence, in
 * scroll order. VideoBackdrop crossfades between these as the visitor
 * scrolls; Nav reads the same list (via useActiveJourneySection) for its
 * stage readout, so there is one definition of "where the visitor is".
 *
 * Filenames match what's actually in public/video/ exactly, including the
 * original typos (standoing, claing, claeaning) — do not "correct" them,
 * the files on disk are spelled this way.
 */
export type JourneySection = {
  /** Matches the section's data-journey attribute. */
  id: string;
  /** Shown in the Nav stage readout. */
  label: string;
  video: string;
};

export const journey: JourneySection[] = [
  { id: 'hero', label: 'Residential parking', video: '/video/standoing-car-clip.mp4' },
  { id: 'transition', label: 'Entering the system', video: '/video/no-human-cleaning.mp4' },
  { id: 'arrival', label: 'Arrival', video: '/video/hands-moving.mp4' },
  { id: 'subscription', label: 'Subscription', video: '/video/cleaning.mp4' },
  { id: 'water', label: 'Water management', video: '/video/water-spray.mp4' },
  { id: 'wash', label: 'The wash', video: '/video/car-soap.mp4' },
  { id: 'quality', label: 'Quality control', video: '/video/brush-deep-claing.mp4' },
  { id: 'drying', label: 'Drying', video: '/video/deep-claeaning.mp4' },
  { id: 'ready', label: 'Ready', video: '/video/final-result.mp4' },
  { id: 'platform', label: 'Platform', video: '/video/interior-cleaning.mp4' },
];
