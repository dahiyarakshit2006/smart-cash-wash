"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, hasAcceptedConsent } from "@/lib/auth";
import { getTodayRoute, getNextStop, TodayRoute, RouteStopWithVehicle } from "@/lib/wash-data";
import { useT, LangToggle } from "@/lib/i18n";
import { SyncStatus } from "@/components/SyncStatus";
import { BottomNav } from "@/components/BottomNav";

const STATE_STYLE: Record<string, { bg: string; icon: string }> = {
  done: { bg: "#16241a", icon: "✓" },
  not_in_slot: { bg: "#241616", icon: "❌" },
  declined: { bg: "#241616", icon: "🚫" },
  blocked: { bg: "#241616", icon: "⛔" },
  already_clean: { bg: "#241616", icon: "✨" },
  in_progress: { bg: "#241d16", icon: "→" },
};

export default function TodayPage() {
  const t = useT();
  const router = useRouter();
  const [workerName, setWorkerName] = useState("");
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
      if (session.role === "supervisor") {
        router.replace("/wash/supervisor");
        return;
      }
      setWorkerName(session.name);
      const r = await getTodayRoute(session.workerId);
      setRoute(r);
    })();
  }, [router]);

  if (route === undefined) return null;

  if (route === null) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <LangToggle />
        </div>
        <p style={{ fontSize: 20, marginTop: 60 }}>{t("route_no_route")}</p>
        <BottomNav />
      </div>
    );
  }

  const next = getNextStop(route);
  const pct = route.totalStops > 0 ? Math.round((route.doneCount / route.totalStops) * 100) : 0;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {t("today_greeting")}, {workerName} 👋
        </div>
        <LangToggle />
      </div>

      <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.6 }}>{route.societyName}</div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.8, marginBottom: 6 }}>
          <span>{t("today_progress")}</span>
          <span>
            {route.doneCount} / {route.totalStops}
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "#1a1a1c", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#22c55e", transition: "width 0.3s" }} />
        </div>
      </div>

      {next ? (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: "#1a2a4a",
            border: "1px solid #2c4a7c",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8, letterSpacing: 1 }}>
            {t("today_next_car").toUpperCase()}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {next.make ?? ""} {next.model ?? ""}
          </div>
          <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 4 }}>{next.registrationNumber}</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
            {t("car_parking")}: {next.tower} - {next.flatNumber}
          </div>
          <button
            onClick={() => router.push(`/wash/car/${next.routeStopId}`)}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 12,
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {t("today_start_car")}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0", fontSize: 20, marginBottom: 24 }}>
          {t("today_all_done")}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, opacity: 0.8 }}>{t("today_your_route")}</h2>
        <SyncStatus />
      </div>

      {Object.entries(route.stopsByTower).map(([tower, stops]) => (
        <div key={tower} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, opacity: 0.6, marginBottom: 6 }}>{tower}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stops.map((stop) => (
              <RouteRow key={stop.routeStopId} stop={stop} onOpen={() => router.push(`/wash/car/${stop.routeStopId}`)} />
            ))}
          </div>
        </div>
      ))}

      <BottomNav />
    </div>
  );
}

function RouteRow({ stop, onOpen }: { stop: RouteStopWithVehicle; onOpen: () => void }) {
  const status = stop.washRecordStatus;
  const style = status ? STATE_STYLE[status] : null;

  return (
    <button
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid #2a2a2c",
        background: style?.bg ?? "#1a1a1c",
        color: "#fff",
        fontSize: 15,
      }}
    >
      <span>
        🚗 {stop.make ?? ""} {stop.model ?? ""}
      </span>
      <span>{style?.icon ?? "○"}</span>
    </button>
  );
}
