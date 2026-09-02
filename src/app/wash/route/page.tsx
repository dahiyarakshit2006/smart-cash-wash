"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, hasAcceptedConsent } from "@/lib/auth";
import { getTodayRoute, TodayRoute } from "@/lib/wash-data";
import { useT, LangToggle } from "@/lib/i18n";

const STATUS_ICON: Record<string, string> = {
  done: "✅",
  not_in_slot: "❌",
  declined: "🚫",
  blocked: "⛔",
  already_clean: "✨",
  in_progress: "⏳",
};

export default function RoutePage() {
  const t = useT();
  const router = useRouter();
  const [route, setRoute] = useState<TodayRoute | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const session = getSession();
      if (!session) {
        router.replace("/wash/login");
        return;
      }
      const consented = await hasAcceptedConsent(session.workerId);
      if (!consented) {
        router.replace("/wash/consent");
        return;
      }
      const r = await getTodayRoute(session.workerId);
      setRoute(r);
    })();
  }, [router]);

  if (route === undefined) return null;

  if (route === null) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <LangToggle />
        </div>
        <p style={{ fontSize: 20, marginTop: 60 }}>{t("route_no_route")}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            background: "#1a1a1c",
            padding: "8px 16px",
            borderRadius: 999,
          }}
        >
          {route.doneCount} / {route.totalStops}
        </div>
        <LangToggle />
      </div>

      {Object.entries(route.stopsByTower).map(([tower, stops]) => (
        <div key={tower} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, opacity: 0.8, marginBottom: 8 }}>{tower}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stops.map((stop) => (
              <button
                key={stop.routeStopId}
                onClick={() => router.push(`/wash/route/${stop.routeStopId}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: "1px solid #2a2a2c",
                  background: stop.washRecordStatus && stop.washRecordStatus !== "in_progress" ? "#16241a" : "#1a1a1c",
                  color: "#fff",
                  fontSize: 18,
                }}
              >
                <span>
                  🚗 {t("route_flat")} {stop.flatNumber}
                </span>
                <span style={{ fontSize: 22 }}>
                  {stop.washRecordStatus ? STATUS_ICON[stop.washRecordStatus] : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
