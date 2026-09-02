// Worker session + OTP. PROVISIONAL auth for Phase 1: no Supabase Auth user
// rows, no JWT — just a worker_id kept in localStorage. This is why the RLS
// policies in supabase/migrations/0001_wash_schema.sql are permissive
// placeholders. Replace with real Supabase Auth (phone OTP) or a proper
// signed session before this goes anywhere near production.

import { supabase } from "@/lib/supabase";

const SESSION_KEY = "wash_worker_session";

// PLUG-IN POINT: a real SMS OTP provider (e.g. Supabase Auth phone OTP,
// MSG91, Twilio Verify) goes here. For now any request "succeeds" and the
// fixed code 000000 is accepted for any phone — there is no real SMS sent.
const MOCK_OTP_CODE = "000000";

export interface WorkerSession {
  workerId: string;
  name: string;
  role: "worker" | "supervisor";
  languagePref: "hi" | "en";
  issuedAt: string;
}

export async function requestOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  const { data: worker, error } = await supabase
    .from("worker")
    .select("id, active")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !worker) return { ok: false, error: "not_registered" };
  if (!worker.active) return { ok: false, error: "inactive" };

  // PLUG-IN POINT: trigger real SMS send here.
  return { ok: true };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  if (code !== MOCK_OTP_CODE) return { ok: false, error: "invalid_code" };

  const { data: worker, error } = await supabase
    .from("worker")
    .select("id, name, role, language_pref")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !worker) return { ok: false, error: "not_registered" };

  const session: WorkerSession = {
    workerId: worker.id,
    name: worker.name,
    role: worker.role,
    languagePref: worker.language_pref,
    issuedAt: new Date().toISOString(),
  };

  // Long-lived by design — no re-auth mid-shift. Session only ends when the
  // worker explicitly logs out (which also revokes consent, see consent.ts).
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

export function getSession(): WorkerSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkerSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function hasAcceptedConsent(workerId: string): Promise<boolean> {
  const { data } = await supabase
    .from("worker")
    .select("consent_accepted_at")
    .eq("id", workerId)
    .maybeSingle();
  return !!data?.consent_accepted_at;
}

export async function acceptConsent(workerId: string, geolocationConsent: boolean): Promise<void> {
  await supabase
    .from("worker")
    .update({
      consent_accepted_at: new Date().toISOString(),
      geolocation_consent: geolocationConsent,
    })
    .eq("id", workerId);
}
