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
  color: string | null;
  washRecordId: string | null;
  washRecordStatus: WashRecordStatus | null;
}

export interface TodayRoute {
  routeId: string;
  societyName: string;
  stopsByTower: Record<string, RouteStopWithVehicle[]>;
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
       vehicle:vehicle_id(id, flat_number, registration_number, color),
       wash_record(id, status)`
    )
    .eq("route_id", route.id)
    .order("tower", { ascending: true })
    .order("sequence_no", { ascending: true });

  const stopsByTower: Record<string, RouteStopWithVehicle[]> = {};
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
      color: vehicle.color,
      washRecordId: latest?.id ?? null,
      washRecordStatus: latest?.status ?? null,
    };

    if (entry.washRecordStatus && entry.washRecordStatus !== "in_progress") doneCount++;

    if (!stopsByTower[s.tower]) stopsByTower[s.tower] = [];
    stopsByTower[s.tower].push(entry);
  }

  const societyName = Array.isArray(route.society)
    ? (route.society[0] as { name: string })?.name
    : (route.society as unknown as { name: string })?.name;

  return {
    routeId: route.id,
    societyName: societyName ?? "",
    stopsByTower,
    totalStops,
    doneCount,
  };
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
}

export async function getRouteStopDetail(routeStopId: string): Promise<StopDetail | null> {
  const { data } = await supabase
    .from("route_stop")
    .select("id, tower, vehicle:vehicle_id(id, flat_number)")
    .eq("id", routeStopId)
    .maybeSingle();

  if (!data) return null;
  const vehicle = Array.isArray(data.vehicle) ? data.vehicle[0] : data.vehicle;

  return {
    routeStopId: data.id,
    vehicleId: (vehicle as { id: string }).id,
    flatNumber: (vehicle as { flat_number: string }).flat_number,
    tower: data.tower,
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
