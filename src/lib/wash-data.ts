// Data access for the worker route/per-car flow. Kept separate from
// src/lib/auth.ts and src/lib/photo-queue so each concern stays isolated.

import { supabase } from "@/lib/supabase";

export type ExceptionStatus = "not_in_slot" | "declined" | "blocked" | "already_clean";
export type WashRecordStatus = "in_progress" | "done" | ExceptionStatus;

export interface RouteStopWithVehicle {
  routeStopId: string;
  tower: string;
  sequenceNo: number;
  vehicleId: string;
  flatNumber: string;
  registrationNumber: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  washRecordId: string | null;
  washRecordStatus: WashRecordStatus | null;
}

export interface TodayRoute {
  routeId: string;
  societyName: string;
  stopsByTower: Record<string, RouteStopWithVehicle[]>;
  orderedStops: RouteStopWithVehicle[];
  totalStops: number;
  doneCount: number;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayRoute(workerId: string): Promise<TodayRoute | null> {
  const { data: route } = await supabase
    .from("route")
    .select("id, society_id, society:society_id(name)")
    .eq("worker_id", workerId)
    .eq("route_date", todayDate())
    .maybeSingle();

  if (!route) return null;

  const { data: stops } = await supabase
    .from("route_stop")
    .select(
      `id, tower, sequence_no,
       vehicle:vehicle_id(id, flat_number, registration_number, make, model, color),
       wash_record(id, status)`
    )
    .eq("route_id", route.id)
    .order("tower", { ascending: true })
    .order("sequence_no", { ascending: true });

  const stopsByTower: Record<string, RouteStopWithVehicle[]> = {};
  const orderedStops: RouteStopWithVehicle[] = [];
  let doneCount = 0;
  const totalStops = stops?.length ?? 0;

  for (const s of stops ?? []) {
    const vehicle = Array.isArray(s.vehicle) ? s.vehicle[0] : s.vehicle;
    const washRecords = (s.wash_record ?? []) as { id: string; status: WashRecordStatus }[];
    // Most recent wash_record wins (re-wash creates a new attempt in a later phase; for
    // Phase 1 there's at most one per stop per day).
    const latest = washRecords[washRecords.length - 1];

    const entry: RouteStopWithVehicle = {
      routeStopId: s.id,
      tower: s.tower,
      sequenceNo: s.sequence_no,
      vehicleId: vehicle.id,
      flatNumber: vehicle.flat_number,
      registrationNumber: vehicle.registration_number,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      washRecordId: latest?.id ?? null,
      washRecordStatus: latest?.status ?? null,
    };

    if (entry.washRecordStatus && entry.washRecordStatus !== "in_progress") doneCount++;

    if (!stopsByTower[s.tower]) stopsByTower[s.tower] = [];
    stopsByTower[s.tower].push(entry);
    orderedStops.push(entry);
  }

  const societyName = Array.isArray(route.society)
    ? (route.society[0] as { name: string })?.name
    : (route.society as unknown as { name: string })?.name;

  return {
    routeId: route.id,
    societyName: societyName ?? "",
    stopsByTower,
    orderedStops,
    totalStops,
    doneCount,
  };
}

// First stop that isn't in a terminal state — this is what the worker sees
// as "Next car". The route determines it automatically; the worker never
// searches for or picks their next car.
export function getNextStop(route: TodayRoute): RouteStopWithVehicle | null {
  return route.orderedStops.find((s) => !s.washRecordStatus || s.washRecordStatus === "in_progress") ?? null;
}

// Called when the worker opens a car. Creates the wash_record if this is the
// first time, so the damage flag has a row to attach to before the wash is
// finished. Idempotent: returns the existing record if one is already open.
export async function openCar(routeStopId: string, workerId: string, vehicleId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("wash_record")
    .select("id, status")
    .eq("route_stop_id", routeStopId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.status === "in_progress") return existing.id;

  const { data: created, error } = await supabase
    .from("wash_record")
    .insert({ route_stop_id: routeStopId, vehicle_id: vehicleId, worker_id: workerId, status: "in_progress" })
    .select("id")
    .single();

  if (error || !created) throw error ?? new Error("failed to open car");
  return created.id;
}

export async function setExceptionStatus(washRecordId: string, status: ExceptionStatus): Promise<void> {
  await supabase
    .from("wash_record")
    .update({ status, completed_at: new Date().toISOString() })
    .eq("id", washRecordId);
}

export async function markDone(washRecordId: string): Promise<void> {
  await supabase
    .from("wash_record")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", washRecordId);
}

export interface StopDetail {
  routeStopId: string;
  vehicleId: string;
  flatNumber: string;
  tower: string;
  make: string | null;
  model: string | null;
  registrationNumber: string | null;
  washRecordId: string | null;
  washRecordStatus: WashRecordStatus | null;
}

export async function getRouteStopDetail(routeStopId: string): Promise<StopDetail | null> {
  const { data } = await supabase
    .from("route_stop")
    .select(
      `id, tower,
       vehicle:vehicle_id(id, flat_number, make, model, registration_number),
       wash_record(id, status)`
    )
    .eq("id", routeStopId)
    .maybeSingle();

  if (!data) return null;
  const vehicle = Array.isArray(data.vehicle) ? data.vehicle[0] : data.vehicle;
  const washRecords = (data.wash_record ?? []) as { id: string; status: WashRecordStatus }[];
  const latest = washRecords[washRecords.length - 1];

  return {
    routeStopId: data.id,
    vehicleId: (vehicle as { id: string }).id,
    flatNumber: (vehicle as { flat_number: string }).flat_number,
    tower: data.tower,
    make: (vehicle as { make: string | null }).make,
    model: (vehicle as { model: string | null }).model,
    registrationNumber: (vehicle as { registration_number: string | null }).registration_number,
    washRecordId: latest?.id ?? null,
    washRecordStatus: latest?.status ?? null,
  };
}

export async function setPhotoKey(
  washRecordId: string,
  slot: "before" | "after",
  key: string
): Promise<void> {
  const column = slot === "before" ? "photo_before_key" : "photo_after_key";
  await supabase
    .from("wash_record")
    .update({ [column]: key })
    .eq("id", washRecordId);
}

// ---- Shift ----

export interface ShiftSummary {
  totalStops: number;
  completedCount: number;
  pendingCount: number;
  issueCount: number;
  shiftStartAt: string | null;
  shiftEndAt: string | null;
}

const ISSUE_STATUSES: WashRecordStatus[] = ["not_in_slot", "declined", "blocked", "already_clean"];

export async function getShiftSummary(workerId: string): Promise<ShiftSummary> {
  const { data: routes } = await supabase
    .from("route")
    .select("id, shift_start_at, shift_end_at, route_stop(id, wash_record(status))")
    .eq("worker_id", workerId)
    .eq("route_date", todayDate());

  let totalStops = 0;
  let completedCount = 0;
  let issueCount = 0;
  let shiftStartAt: string | null = null;
  let shiftEndAt: string | null = null;

  for (const r of routes ?? []) {
    if (r.shift_start_at) shiftStartAt = r.shift_start_at;
    if (r.shift_end_at) shiftEndAt = r.shift_end_at;
    const stops = (r.route_stop ?? []) as { wash_record: { status: WashRecordStatus }[] }[];
    totalStops += stops.length;
    for (const s of stops) {
      const latest = s.wash_record?.[s.wash_record.length - 1];
      if (!latest) continue;
      if (latest.status === "done") completedCount++;
      else if (ISSUE_STATUSES.includes(latest.status)) issueCount++;
    }
  }

  return {
    totalStops,
    completedCount,
    pendingCount: totalStops - completedCount - issueCount,
    issueCount,
    shiftStartAt,
    shiftEndAt,
  };
}

export async function startShift(workerId: string, geo: { lat: number; lng: number } | null): Promise<void> {
  const update: Record<string, unknown> = { shift_start_at: new Date().toISOString() };
  if (geo) {
    update.shift_start_lat = geo.lat;
    update.shift_start_lng = geo.lng;
  }
  await supabase.from("route").update(update).eq("worker_id", workerId).eq("route_date", todayDate());
}

export async function endShift(workerId: string, geo: { lat: number; lng: number } | null): Promise<void> {
  const update: Record<string, unknown> = { shift_end_at: new Date().toISOString() };
  if (geo) {
    update.shift_end_lat = geo.lat;
    update.shift_end_lng = geo.lng;
  }
  await supabase.from("route").update(update).eq("worker_id", workerId).eq("route_date", todayDate());
}

// ---- Profile ----

export interface ProfileStats {
  carsCompletedThisMonth: number;
  workingDaysThisMonth: number;
}

export async function getProfileStats(workerId: string): Promise<ProfileStats> {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const { data: records } = await supabase
    .from("wash_record")
    .select("completed_at")
    .eq("worker_id", workerId)
    .eq("status", "done")
    .gte("completed_at", monthStartStr);

  const days = new Set((records ?? []).map((r) => r.completed_at?.slice(0, 10)));

  return {
    carsCompletedThisMonth: records?.length ?? 0,
    workingDaysThisMonth: days.size,
  };
}

// ---- Supervisor view ----

export interface WorkerCompletion {
  workerId: string;
  workerName: string;
  routeId: string | null;
  societyName: string;
  totalStops: number;
  doneCount: number;
  hasStarted: boolean;
}

export async function getSupervisorOverview(clusterId: string): Promise<WorkerCompletion[]> {
  const { data: routes } = await supabase
    .from("route")
    .select(
      `id, worker_id, worker:worker_id(id, name), society:society_id(name),
       route_stop(id, wash_record(status))`
    )
    .eq("route_date", todayDate())
    .eq("worker.cluster_id", clusterId);

  return (routes ?? []).map((r) => {
    const worker = Array.isArray(r.worker) ? r.worker[0] : r.worker;
    const society = Array.isArray(r.society) ? r.society[0] : r.society;
    const stops = (r.route_stop ?? []) as { wash_record: { status: WashRecordStatus }[] }[];
    const totalStops = stops.length;
    let doneCount = 0;
    let hasStarted = false;
    for (const s of stops) {
      const latest = s.wash_record?.[s.wash_record.length - 1];
      if (latest) {
        hasStarted = true;
        if (latest.status !== "in_progress") doneCount++;
      }
    }
    return {
      workerId: (worker as { id: string })?.id,
      workerName: (worker as { name: string })?.name ?? "",
      routeId: r.id,
      societyName: (society as { name: string })?.name ?? "",
      totalStops,
      doneCount,
      hasStarted,
    };
  });
}

export interface ReassignTarget {
  workerId: string;
  name: string;
  currentLoad: number;
}

export async function getReassignTargets(clusterId: string, excludeWorkerId: string): Promise<ReassignTarget[]> {
  const { data } = await supabase
    .from("worker")
    .select("id, name, route(id, route_date, route_stop(id))")
    .eq("cluster_id", clusterId)
    .eq("role", "worker")
    .eq("active", true)
    .neq("id", excludeWorkerId);

  const today = todayDate();
  return (data ?? []).map((w) => {
    const routes = (w.route ?? []) as { route_date: string; route_stop: { id: string }[] }[];
    const currentLoad = routes
      .filter((r) => r.route_date === today)
      .reduce((sum, r) => sum + (r.route_stop?.length ?? 0), 0);
    return { workerId: w.id, name: w.name, currentLoad };
  });
}

export async function reassignRoute(routeId: string, newWorkerId: string): Promise<void> {
  await supabase.from("route").update({ worker_id: newWorkerId }).eq("id", routeId);
}

export interface SpotCheckItem {
  washRecordId: string;
  workerName: string;
  flatNumber: string;
  tower: string;
  make: string | null;
  model: string | null;
  completedAt: string;
  photoBeforeKey: string | null;
  photoAfterKey: string | null;
}

export async function getSpotCheckQueue(clusterId: string): Promise<SpotCheckItem[]> {
  const { data } = await supabase
    .from("wash_record")
    .select(
      `id, completed_at, photo_before_key, photo_after_key,
       worker:worker_id(name, cluster_id),
       route_stop:route_stop_id(tower, vehicle:vehicle_id(flat_number, make, model))`
    )
    .eq("status", "done")
    .eq("supervisor_signed_off", false)
    .order("completed_at", { ascending: true });

  return (data ?? [])
    .filter((r) => {
      const worker = Array.isArray(r.worker) ? r.worker[0] : r.worker;
      return (worker as { cluster_id: string })?.cluster_id === clusterId;
    })
    .map((r) => {
      const worker = Array.isArray(r.worker) ? r.worker[0] : r.worker;
      const stop = Array.isArray(r.route_stop) ? r.route_stop[0] : r.route_stop;
      const vehicle = Array.isArray(stop?.vehicle) ? stop.vehicle[0] : stop?.vehicle;
      return {
        washRecordId: r.id,
        workerName: (worker as { name: string })?.name ?? "",
        flatNumber: (vehicle as { flat_number: string })?.flat_number ?? "",
        tower: (stop as { tower: string })?.tower ?? "",
        make: (vehicle as { make: string | null })?.make ?? null,
        model: (vehicle as { model: string | null })?.model ?? null,
        completedAt: r.completed_at,
        photoBeforeKey: r.photo_before_key,
        photoAfterKey: r.photo_after_key,
      };
    });
}

// ---- Cluster overview ----

export interface ClusterOverview {
  workerCount: number;
  startedCount: number;
  absentCount: number;
  carsAssigned: number;
  carsCompleted: number;
  carsPending: number;
  carsIssues: number;
}

export async function getClusterOverview(clusterId: string): Promise<ClusterOverview> {
  const overview = await getSupervisorOverview(clusterId);

  const { data: workers } = await supabase
    .from("worker")
    .select("id")
    .eq("cluster_id", clusterId)
    .eq("role", "worker")
    .eq("active", true);

  const workerCount = workers?.length ?? 0;
  const startedCount = overview.filter((w) => w.hasStarted).length;

  const { data: routes } = await supabase
    .from("route")
    .select("id, worker:worker_id(cluster_id), route_stop(id, wash_record(status))")
    .eq("route_date", todayDate())
    .eq("worker.cluster_id", clusterId);

  let carsAssigned = 0;
  let carsCompleted = 0;
  let carsIssues = 0;
  for (const r of routes ?? []) {
    const stops = (r.route_stop ?? []) as { wash_record: { status: WashRecordStatus }[] }[];
    carsAssigned += stops.length;
    for (const s of stops) {
      const latest = s.wash_record?.[s.wash_record.length - 1];
      if (!latest) continue;
      if (latest.status === "done") carsCompleted++;
      else if (ISSUE_STATUSES.includes(latest.status)) carsIssues++;
    }
  }
  const carsPending = carsAssigned - carsCompleted - carsIssues;

  return {
    workerCount,
    startedCount,
    absentCount: workerCount - startedCount,
    carsAssigned,
    carsCompleted,
    carsPending,
    carsIssues,
  };
}

export type RewashReason = "not_clean" | "missed_spot" | "customer_complaint" | "other";
export type RewashPriority = "low" | "normal" | "high";

export async function signOff(
  washRecordId: string,
  supervisorId: string,
  requiresRewash: boolean,
  rewash?: { reason: RewashReason; priority: RewashPriority }
): Promise<void> {
  await supabase
    .from("wash_record")
    .update({
      supervisor_signed_off: true,
      supervisor_id: supervisorId,
      supervisor_signed_off_at: new Date().toISOString(),
      requires_rewash: requiresRewash,
      rewash_reason: rewash?.reason ?? null,
      rewash_priority: rewash?.priority ?? null,
    })
    .eq("id", washRecordId);
}

export async function getPhotoSignedUrls(
  beforeKey: string | null,
  afterKey: string | null
): Promise<{ before: string | null; after: string | null }> {
  const [before, after] = await Promise.all([
    beforeKey
      ? supabase.storage.from("wash-photos").createSignedUrl(beforeKey, 3600).then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
    afterKey
      ? supabase.storage.from("wash-photos").createSignedUrl(afterKey, 3600).then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
  ]);
  return { before, after };
}

export interface RewashItem {
  washRecordId: string;
  workerName: string;
  flatNumber: string;
  tower: string;
  reason: string | null;
  priority: RewashPriority | null;
}

export async function getRewashQueue(clusterId: string): Promise<RewashItem[]> {
  const { data } = await supabase
    .from("wash_record")
    .select(
      `id, rewash_reason, rewash_priority,
       worker:worker_id(name, cluster_id),
       route_stop:route_stop_id(tower, vehicle:vehicle_id(flat_number))`
    )
    .eq("requires_rewash", true);

  return (data ?? [])
    .filter((r) => {
      const worker = Array.isArray(r.worker) ? r.worker[0] : r.worker;
      return (worker as { cluster_id: string })?.cluster_id === clusterId;
    })
    .map((r) => {
      const worker = Array.isArray(r.worker) ? r.worker[0] : r.worker;
      const stop = Array.isArray(r.route_stop) ? r.route_stop[0] : r.route_stop;
      const vehicle = Array.isArray(stop?.vehicle) ? stop.vehicle[0] : stop?.vehicle;
      return {
        washRecordId: r.id,
        workerName: (worker as { name: string })?.name ?? "",
        flatNumber: (vehicle as { flat_number: string })?.flat_number ?? "",
        tower: (stop as { tower: string })?.tower ?? "",
        reason: r.rewash_reason as string | null,
        priority: r.rewash_priority as RewashPriority | null,
      };
    })
    .sort((a, b) => {
      const order: Record<RewashPriority, number> = { high: 0, normal: 1, low: 2 };
      const ap: RewashPriority = a.priority ?? "normal";
      const bp: RewashPriority = b.priority ?? "normal";
      return order[ap] - order[bp];
    });
}

export async function clearRewash(washRecordId: string): Promise<void> {
  await supabase.from("wash_record").update({ requires_rewash: false }).eq("id", washRecordId);
}

export async function flagDamage(params: {
  washRecordId: string;
  vehicleId: string;
  workerId: string;
  preExisting: boolean;
  photoKeys: string[];
}): Promise<void> {
  await supabase.from("damage_report").insert({
    wash_record_id: params.washRecordId,
    vehicle_id: params.vehicleId,
    worker_id: params.workerId,
    pre_existing: params.preExisting,
    photo_keys: params.photoKeys,
  });
}
