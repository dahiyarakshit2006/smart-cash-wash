"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, hasAcceptedConsent } from "@/lib/auth";
import { getTodayRoute, getNextStop, TodayRoute, RouteStopWithVehicle } from "@/lib/wash-data";
import { useT, LangToggle } from "@/lib/i18n";
import { SyncStatus } from "@/components/SyncStatus";
import { BottomNav } from "@/components/BottomNav";

const STATE_STYLE: Record<string, { className: string; icon: string }> = {
  done: { className: "bg-accent/10 border-accent/30", icon: "✓" },
  not_in_slot: { className: "bg-sodium/10 border-sodium/30", icon: "❌" },
  declined: { className: "bg-sodium/10 border-sodium/30", icon: "🚫" },
  blocked: { className: "bg-sodium/10 border-sodium/30", icon: "⛔" },
  already_clean: { className: "bg-sodium/10 border-sodium/30", icon: "✨" },
  in_progress: { className: "bg-ice/10 border-ice/30", icon: "→" },
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
      <div className="px-6 pb-24 pt-8 text-center">
        <div className="mb-8 flex justify-end">
          <LangToggle />
        </div>
        <p className="wash-greeting mt-16">{t("route_no_route")}</p>
        <BottomNav />
      </div>
    );
  }

  const next = getNextStop(route);
  const pct = route.totalStops > 0 ? Math.round((route.doneCount / route.totalStops) * 100) : 0;

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="wash-greeting">
          {t("today_greeting")}, {workerName} 👋
        </div>
        <LangToggle />
      </div>

      <div className="wash-eyebrow mb-6">{route.societyName}</div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-muted">
          <span>{t("today_progress")}</span>
          <span className="text-chalk">
            {route.doneCount} / {route.totalStops}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-accent transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {next ? (
        <div className="wash-card mb-6 border-accent/30 p-5">
          <div className="wash-eyebrow mb-2 text-accent">{t("today_next_car")}</div>
          <div className="mb-1 font-display text-2xl font-extrabold uppercase tracking-tightest text-chalk">
            {next.make ?? ""} {next.model ?? ""}
          </div>
          <div className="mb-1 text-base text-chalk/80">{next.registrationNumber}</div>
          <div className="mb-5 text-sm text-muted">
            {t("car_parking")}: {next.tower} - {next.flatNumber}
          </div>
          <button onClick={() => router.push(`/wash/car/${next.routeStopId}`)} className="wash-btn-primary">
            {t("today_start_car")}
          </button>
        </div>
      ) : (
        <div className="wash-greeting mb-6 py-10 text-center">{t("today_all_done")}</div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="wash-eyebrow">{t("today_your_route")}</h2>
        <SyncStatus />
      </div>

      {Object.entries(route.stopsByTower).map(([tower, stops]) => (
        <div key={tower} className="mb-4">
          <h3 className="mb-2 text-xs text-muted">{tower}</h3>
          <div className="flex flex-col gap-1.5">
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
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-base text-chalk transition-colors duration-150 ${
        style?.className ?? "border-line bg-raised"
      }`}
    >
      <span>
        🚗 {stop.make ?? ""} {stop.model ?? ""}
      </span>
      <span>{style?.icon ?? "○"}</span>
    </button>
  );
}
