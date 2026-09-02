// Seeds Phase 1 fake data: 1 cluster, 2 societies, ~20 vehicles, 2 workers, 1 supervisor.
// Run with: node scripts/seed-wash.mjs
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

async function main() {
  const [cluster] = await insert("cluster", [{ name: "Sector 12 Cluster", city: "Gurugram" }]);
  console.log("cluster", cluster.id);

  const societies = await insert("society", [
    {
      cluster_id: cluster.id,
      name: "Greenfield Residency",
      address: "Sector 12, Gurugram",
      tower_list: ["Tower A", "Tower B"],
    },
    {
      cluster_id: cluster.id,
      name: "Palm Meadows",
      address: "Sector 12, Gurugram",
      tower_list: ["Tower C"],
    },
  ]);
  console.log("societies", societies.map((s) => s.name));

  const [greenfield, palmMeadows] = societies;

  const vehiclePlan = [
    { society: greenfield, tower: "Tower A", count: 6 },
    { society: greenfield, tower: "Tower B", count: 6 },
    { society: palmMeadows, tower: "Tower C", count: 8 },
  ];

  const vehicleRows = [];
  let flatCounter = 101;
  for (const plan of vehiclePlan) {
    for (let i = 0; i < plan.count; i++) {
      const flat = `${flatCounter + i}`;
      vehicleRows.push({
        society_id: plan.society.id,
        tower: plan.tower,
        flat_number: flat,
        registration_number: `HR26AB${1000 + vehicleRows.length}`,
        vehicle_type: "car",
        color: ["White", "Black", "Silver", "Red"][vehicleRows.length % 4],
      });
    }
    flatCounter += 100;
  }
  const vehicles = await insert("vehicle", vehicleRows);
  console.log(`vehicles: ${vehicles.length}`);

  const workers = await insert("worker", [
    { cluster_id: cluster.id, name: "Ramesh Kumar", phone: "+919810000001", role: "worker", language_pref: "hi" },
    { cluster_id: cluster.id, name: "Suresh Yadav", phone: "+919810000002", role: "worker", language_pref: "hi" },
    { cluster_id: cluster.id, name: "Anita Sharma", phone: "+919810000003", role: "supervisor", language_pref: "en" },
  ]);
  console.log("workers", workers.map((w) => `${w.name} (${w.role})`));

  const [ramesh, suresh, anita] = workers;

  const today = new Date().toISOString().slice(0, 10);
  const routes = await insert("route", [
    { worker_id: ramesh.id, society_id: greenfield.id, route_date: today, created_by: anita.id },
    { worker_id: suresh.id, society_id: palmMeadows.id, route_date: today, created_by: anita.id },
  ]);

  const [routeGreenfield, routePalmMeadows] = routes;
  const greenfieldVehicles = vehicles.filter((v) => v.society_id === greenfield.id);
  const palmMeadowsVehicles = vehicles.filter((v) => v.society_id === palmMeadows.id);

  const routeStopRows = [];
  const bySequence = {};
  for (const v of greenfieldVehicles) {
    bySequence[v.tower] = (bySequence[v.tower] ?? 0) + 1;
    routeStopRows.push({
      route_id: routeGreenfield.id,
      vehicle_id: v.id,
      tower: v.tower,
      sequence_no: bySequence[v.tower],
    });
  }
  const bySequence2 = {};
  for (const v of palmMeadowsVehicles) {
    bySequence2[v.tower] = (bySequence2[v.tower] ?? 0) + 1;
    routeStopRows.push({
      route_id: routePalmMeadows.id,
      vehicle_id: v.id,
      tower: v.tower,
      sequence_no: bySequence2[v.tower],
    });
  }
  await insert("route_stop", routeStopRows);
  console.log(`route_stops: ${routeStopRows.length}`);

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
