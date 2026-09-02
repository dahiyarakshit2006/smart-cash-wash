// Seeds Phase 1 demo data at brief scale: 1 cluster, 3 societies, 10
// workers, 1 supervisor, ~100 vehicles with realistic Indian makes/models
// and registration numbers. Wipes prior /wash demo data first (cascades
// from cluster) so this is safe to re-run.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnvLocal() {
  try {
    const contents = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of contents.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) process.env[match[1]] ??= match[2];
    }
  } catch {
    // .env.local not found — assume env vars are already set
  }
}
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insert(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

const CAR_CATALOG = [
  ["Maruti Suzuki", "Swift"],
  ["Maruti Suzuki", "Baleno"],
  ["Hyundai", "Creta"],
  ["Hyundai", "Verna"],
  ["Hyundai", "i20"],
  ["Honda", "City"],
  ["Honda", "Amaze"],
  ["Tata", "Nexon"],
  ["Tata", "Harrier"],
  ["Mahindra", "XUV700"],
  ["Toyota", "Innova Crysta"],
  ["Kia", "Seltos"],
  ["BMW", "X1"],
  ["BMW", "3 Series"],
  ["Mercedes-Benz", "C-Class"],
  ["Audi", "A4"],
  ["Skoda", "Slavia"],
  ["Volkswagen", "Virtus"],
];
const COLORS = ["White", "Black", "Silver", "Red", "Grey", "Blue"];

function regNumber(i) {
  const states = ["DL", "UP", "HR"];
  const state = states[i % states.length];
  const rto = String(1 + (i % 20)).padStart(2, "0");
  const letters = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i * 3) % 26));
  const num = String(1000 + i).slice(-4);
  return `${state}${rto}${letters}${num}`;
}

async function wipeExisting() {
  // Wipes ALL clusters — this is dev/demo seed data only, safe to fully reset.
  const { data: clusters } = await supabase.from("cluster").select("id");
  for (const c of clusters ?? []) {
    await supabase.from("cluster").delete().eq("id", c.id);
  }
}

async function main() {
  await wipeExisting();

  const [cluster] = await insert("cluster", [{ name: "Noida Cluster", city: "Noida" }]);
  console.log("cluster", cluster.id);

  const societyDefs = [
    { name: "Sector 137 Greens", towers: ["Tower A", "Tower B", "Tower C"] },
    { name: "Sector 78 Amrapali", towers: ["Tower 1", "Tower 2"] },
    { name: "Sector 150 Ace", towers: ["Tower X", "Tower Y", "Tower Z"] },
  ];
  const societies = await insert(
    "society",
    societyDefs.map((s) => ({
      cluster_id: cluster.id,
      name: s.name,
      address: `${s.name}, Noida, UP`,
      tower_list: s.towers,
    }))
  );
  console.log("societies", societies.map((s) => s.name));

  // ~100 vehicles spread across societies/towers
  const vehicleRows = [];
  let vi = 0;
  for (let si = 0; si < societies.length; si++) {
    const towers = societyDefs[si].towers;
    const perSociety = si === societies.length - 1 ? 100 - vehicleRows.length : Math.round(100 / societies.length);
    for (let i = 0; i < perSociety; i++) {
      const tower = towers[i % towers.length];
      const [make, model] = CAR_CATALOG[vi % CAR_CATALOG.length];
      vehicleRows.push({
        society_id: societies[si].id,
        tower,
        flat_number: `${100 + Math.floor(i / towers.length)}${String.fromCharCode(65 + (i % 4))}`,
        registration_number: regNumber(vi),
        vehicle_type: "car",
        make,
        model,
        color: COLORS[vi % COLORS.length],
      });
      vi++;
    }
  }
  const vehicles = await insert("vehicle", vehicleRows);
  console.log(`vehicles: ${vehicles.length}`);

  const workerNames = [
    "Ramesh Kumar",
    "Suresh Yadav",
    "Vijay Singh",
    "Sanjay Prasad",
    "Deepak Mishra",
    "Rajesh Verma",
    "Amit Kumar",
    "Manoj Tiwari",
    "Ashok Pandey",
    "Naresh Chauhan",
  ];
  const workerRows = workerNames.map((name, i) => ({
    cluster_id: cluster.id,
    name,
    phone: `+9198100000${String(10 + i).padStart(2, "0")}`,
    role: "worker",
    language_pref: "hi",
  }));
  workerRows.push({
    cluster_id: cluster.id,
    name: "Anita Sharma",
    phone: "+919810000003",
    role: "supervisor",
    language_pref: "en",
  });
  const workers = await insert("worker", workerRows);
  console.log("workers", workers.map((w) => `${w.name} (${w.role}) ${w.phone}`).join("\n"));

  const supervisor = workers.find((w) => w.role === "supervisor");
  const routeWorkers = workers.filter((w) => w.role === "worker");

  const today = new Date().toISOString().slice(0, 10);

  // Assign each society's vehicles round-robin across a few workers so
  // completion/progress views have something realistic to show.
  for (let si = 0; si < societies.length; si++) {
    const societyVehicles = vehicles.filter((v) => v.society_id === societies[si].id);
    const workersForSociety = routeWorkers.slice(si * 3, si * 3 + 3);
    if (workersForSociety.length === 0) continue;

    const perWorker = Math.ceil(societyVehicles.length / workersForSociety.length);
    for (let wi = 0; wi < workersForSociety.length; wi++) {
      const worker = workersForSociety[wi];
      const slice = societyVehicles.slice(wi * perWorker, (wi + 1) * perWorker);
      if (slice.length === 0) continue;

      const [route] = await insert("route", [
        { worker_id: worker.id, society_id: societies[si].id, route_date: today, created_by: supervisor.id },
      ]);

      const bySequence = {};
      const stopRows = slice.map((v) => {
        bySequence[v.tower] = (bySequence[v.tower] ?? 0) + 1;
        return { route_id: route.id, vehicle_id: v.id, tower: v.tower, sequence_no: bySequence[v.tower] };
      });
      await insert("route_stop", stopRows);
    }
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
