/** Demo data for the operations dashboard visualisation. */
export const opsSociety = {
  name: 'Cluster 04 · Sector 137, Noida',
  societies: 3,
  cars: 500,
  activeSubscriptions: 421,
  workers: 10,
  washesToday: 386,
  openComplaints: 2,
  satisfaction: 96,
  waterTodayLitres: 3120,
  routeUtilisation: 87,
};

export const opsFeed = [
  { time: '06:12', text: 'Route A started · 4 workers on shift' },
  { time: '07:48', text: 'Backup worker assigned to Tower C (absence)' },
  { time: '08:42', text: 'B-1204 washed · quality approved' },
  { time: '09:30', text: 'Complaint #218 resolved · re-wash completed' },
  { time: '11:05', text: 'Water log submitted · 3,120 L across 386 washes' },
];

/** Resident-facing demo card. Generic vehicle — no third-party marks. */
export const residentDemo = {
  vehicle: 'Sedan · DL 3C AB 1204',
  parking: 'Basement 2 · Slot B-114',
  status: 'Washed today',
  lastService: '8:42 AM',
  nextScheduled: 'Tomorrow, before 9:00 AM',
  plan: 'Standard',
  washesThisMonth: 18,
};

export const rwaBenefits = [
  { title: 'Verified workforce', body: 'Police-verified, uniformed, ID-carded workers on a named roster the RWA holds.' },
  { title: 'Reliable operations', body: 'A backup worker covers absence the same morning. Service does not depend on one person showing up.' },
  { title: 'Quality control', body: 'One written SOP, a supervisor per cluster, and a recorded check on every vehicle.' },
  { title: 'Water management', body: 'Method chosen by dirt level, litres logged per wash, totals reported to the RWA monthly.' },
  { title: 'Single point of contact', body: 'One contract, one escalation number. The committee stops arbitrating between residents and washers.' },
  { title: 'Monthly reporting', body: 'Coverage, complaints, resolution times and water consumption, in writing.' },
];

export const futureServices = [
  'Interior detailing', 'Machine polishing', 'Ceramic coating', 'Periodic servicing',
  'Tyres', 'Batteries', 'Insurance renewal', 'Roadside assistance', 'Pre-purchase inspection', 'Pickup and drop',
];
