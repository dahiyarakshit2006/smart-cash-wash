"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTodayRoute, TodayRoute } from "@/lib/wash-data";
import { supabase } from "@/lib/supabase";

const STATUS_LABEL: Record<string, string> = {
  done: "✅ Done",
  not_in_slot: "❌ Not in slot",
  declined: "🚫 Declined",
  blocked: "⛔ Blocked",
  already_clean: "✨ Already clean",
  in_progress: "⏳ In progress",
};

export default function SupervisorWorkerRoutePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [workerName, setWorkerName] = useState("");
  const [route, setRoute] = useState<TodayRoute | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const session = getSession();
      if (!session || session.role !== "supervisor") {
        router.replace("/wash/login");
        return;
      }
      const { data: worker } = await supabase.from("worker").select("name").eq("id", params.id).maybeSingle();
      setWorkerName(worker?.name ?? "");
      setRoute(await getTodayRoute(params.id));
    })();
  }, [params.id, router]);

  if (route === undefined) return null;

  return (
    <div className="mx-auto max-w-md px-6 py-8 font-sans text-chalk">
      <button
        onClick={() => router.push("/wash/supervisor")}
        className="rounded-lg border border-line px-3 py-2 text-sm text-chalk"
      >
        ← Back
      </button>
      <h1 className="wash-heading my-5">{workerName}'s route</h1>

      {!route && <p className="text-muted">No route assigned today.</p>}

      {route &&
        Object.entries(route.stopsByTower).map(([tower, stops]) => (
          <div key={tower} className="mb-5">
            <h2 className="mb-2 text-sm text-muted">{tower}</h2>
            <div className="flex flex-col gap-1.5">
              {stops.map((s) => (
                <div key={s.routeStopId} className="wash-card flex justify-between px-4 py-2.5">
                  <span>
                    {s.make} {s.model} · {s.flatNumber}
                  </span>
                  <span className="text-sm text-muted">{s.washRecordStatus ? STATUS_LABEL[s.washRecordStatus] : "○"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
