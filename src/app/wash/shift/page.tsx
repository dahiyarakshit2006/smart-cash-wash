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
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="wash-heading">{t("shift_title")}</h1>
        <LangToggle />
      </div>

      {notStarted && (
        <div className="py-6 text-center">
          <div className="wash-eyebrow mb-2">{t("shift_assigned_cars")}</div>
          <div className="mb-8 font-display text-6xl font-black text-chalk">{summary.totalStops}</div>
          <button onClick={onStart} className="wash-btn-primary">
            {t("shift_start")}
          </button>
        </div>
      )}

      {!notStarted && !ended && (
        <>
          <h2 className="wash-eyebrow mb-3">{t("shift_progress")}</h2>
          <div className="mb-6 grid grid-cols-3 gap-2">
            <StatCard label={t("shift_completed")} value={summary.completedCount} colorClass="text-accent" />
            <StatCard label={t("shift_pending")} value={summary.pendingCount} colorClass="text-ice" />
            <StatCard label={t("shift_issues")} value={summary.issueCount} colorClass="text-sodium" />
          </div>
          <button onClick={onEnd} className="wash-btn-secondary">
            {t("shift_end")}
          </button>
        </>
      )}

      {ended && (
        <div className="py-6 text-center">
          <div className="wash-greeting mb-6">{t("shift_complete_title")}</div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={t("shift_completed")} value={summary.completedCount} colorClass="text-accent" />
            <StatCard label={t("shift_pending")} value={summary.pendingCount} colorClass="text-ice" />
            <StatCard label={t("shift_exceptions")} value={summary.issueCount} colorClass="text-sodium" />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="wash-card px-2 py-4 text-center">
      <div className={`font-display text-2xl font-extrabold ${colorClass}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
