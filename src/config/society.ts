/** Demo data for the monthly RWA report card — the artefact a committee receives, not a live ops view. */
export const monthlyReport = {
  society: 'Sector 137, Noida',
  period: 'August 2026',
  contractedWashes: 6600,
  deliveredWashes: 6482,
  openComplaints: 2,
  complaintsRaised: 9,
  avgResolutionHours: 4.5,
  waterLoggedLitres: 94300,
  workerAttendance: 97,
};

export const reportFeed = [
  { time: '03 Aug', text: 'Backup worker deployed same morning · 1 absence covered' },
  { time: '11 Aug', text: 'Complaint #218 logged · re-wash completed, resolved in 3h' },
  { time: '18 Aug', text: 'Monthly SOP audit completed · no deviations found' },
  { time: '24 Aug', text: 'Water log reconciled with RWA · 94,300 L across the month' },
  { time: '29 Aug', text: 'Attendance review · 97% shift coverage this month' },
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
