"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, WorkerSession } from "@/lib/auth";
import { getShiftSummary, startShift, endShift, ShiftSummary } from "@/lib/wash-data";
import { useT, LangToggle } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";

function getGeo(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

export default function ShiftPage() {
  const t = useT();
  const router = useRouter();
  const [session, setSession] = useState<WorkerSession | null>(null);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);

  const load = async (workerId: string) => {
    setSummary(await getShiftSummary(workerId));
  };

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/wash/login");
      return;
    }
    setSession(s);
    load(s.workerId);
  }, [router]);

  const onStart = async () => {
    if (!session) return;
    const geo = session.geolocationConsent ? await getGeo() : null;
    await startShift(session.workerId, geo);
    await load(session.workerId);
  };

  const onEnd = async () => {
    if (!session) return;
    const geo = session.geolocationConsent ? await getGeo() : null;
    await endShift(session.workerId, geo);
    await load(session.workerId);
  };

  if (!session || !summary) return null;

  const notStarted = !summary.shiftStartAt;
  const ended = !!summary.shiftEndAt;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20 }}>{t("shift_title")}</h1>
        <LangToggle />
      </div>

      {notStarted && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 8 }}>{t("shift_assigned_cars")}</div>
          <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 24 }}>{summary.totalStops}</div>
          <button onClick={onStart} style={primaryButtonStyle}>
            {t("shift_start")}
          </button>
        </div>
      )}

      {!notStarted && !ended && (
        <>
          <h2 style={{ fontSize: 15, opacity: 0.8, marginBottom: 12 }}>{t("shift_progress")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
            <StatCard label={t("shift_completed")} value={summary.completedCount} color="#22c55e" />
            <StatCard label={t("shift_pending")} value={summary.pendingCount} color="#f59e0b" />
            <StatCard label={t("shift_issues")} value={summary.issueCount} color="#ef4444" />
          </div>
          <button onClick={onEnd} style={secondaryButtonStyle}>
            {t("shift_end")}
          </button>
        </>
      )}

      {ended && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 22, marginBottom: 20 }}>{t("shift_complete_title")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <StatCard label={t("shift_completed")} value={summary.completedCount} color="#22c55e" />
            <StatCard label={t("shift_pending")} value={summary.pendingCount} color="#f59e0b" />
            <StatCard label={t("shift_exceptions")} value={summary.issueCount} color="#ef4444" />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: "16px 8px", borderRadius: 12, background: "#1a1a1c", textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 18,
  borderRadius: 12,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontSize: 18,
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
  fontSize: 16,
};
