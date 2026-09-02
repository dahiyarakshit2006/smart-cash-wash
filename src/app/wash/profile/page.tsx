"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession, WorkerSession } from "@/lib/auth";
import { getProfileStats, ProfileStats } from "@/lib/wash-data";
import { supabase } from "@/lib/supabase";
import { useT, LangToggle } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const [session, setSession] = useState<WorkerSession | null>(null);
  const [clusterName, setClusterName] = useState("");
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    (async () => {
      const s = getSession();
      if (!s) {
        router.replace("/wash/login");
        return;
      }
      setSession(s);
      const [statsResult, clusterResult] = await Promise.all([
        getProfileStats(s.workerId),
        supabase.from("cluster").select("name").eq("id", s.clusterId).maybeSingle(),
      ]);
      setStats(statsResult);
      setClusterName(clusterResult.data?.name ?? "");
    })();
  }, [router]);

  const onLogout = () => {
    clearSession();
    router.replace("/wash/login");
  };

  if (!session || !stats) return null;

  const workerCode = `CW-${session.workerId.slice(0, 4).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="wash-heading">{t("profile_title")}</h1>
        <LangToggle />
      </div>

      <div className="mb-6 text-center">
        <div className="wash-greeting">{session.name}</div>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <Row label={t("profile_worker_id")} value={workerCode} />
        <Row label={t("profile_cluster")} value={clusterName} />
      </div>

      <h2 className="wash-eyebrow mb-3">{t("profile_this_month")}</h2>
      <div className="mb-8 grid grid-cols-2 gap-2.5">
        <StatCard label={t("profile_cars_completed")} value={stats.carsCompletedThisMonth} />
        <StatCard label={t("profile_working_days")} value={stats.workingDaysThisMonth} />
      </div>

      <button onClick={onLogout} className="w-full rounded-xl border border-line px-4 py-3.5 text-sm text-sodium">
        {t("profile_logout")}
      </button>

      <BottomNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="wash-card flex justify-between px-4 py-3">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-chalk">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="wash-card px-4 py-5 text-center">
      <div className="font-display text-3xl font-extrabold text-accent">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
