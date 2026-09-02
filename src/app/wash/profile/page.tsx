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
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20 }}>{t("profile_title")}</h1>
        <LangToggle />
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{session.name}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <Row label={t("profile_worker_id")} value={workerCode} />
        <Row label={t("profile_cluster")} value={clusterName} />
      </div>

      <h2 style={{ fontSize: 14, opacity: 0.7, marginBottom: 10 }}>{t("profile_this_month")}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
        <StatCard label={t("profile_cars_completed")} value={stats.carsCompletedThisMonth} />
        <StatCard label={t("profile_working_days")} value={stats.workingDaysThisMonth} />
      </div>

      <button onClick={onLogout} style={logoutButtonStyle}>
        {t("profile_logout")}
      </button>

      <BottomNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 10,
        background: "#1a1a1c",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: "#1a1a1c", textAlign: "center" }}>
      <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const logoutButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #333",
  background: "transparent",
  color: "#f87171",
  fontSize: 15,
};
