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
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif", color: "#fff" }}>
      <button onClick={() => router.push("/wash/supervisor")} style={backButtonStyle}>
        ← Back
      </button>
      <h1 style={{ fontSize: 20, margin: "16px 0" }}>{workerName}'s route</h1>

      {!route && <p style={{ opacity: 0.6 }}>No route assigned today.</p>}

      {route &&
        Object.entries(route.stopsByTower).map(([tower, stops]) => (
          <div key={tower} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>{tower}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stops.map((s) => (
                <div
                  key={s.routeStopId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#1a1a1c",
                  }}
                >
                  <span>
                    {s.make} {s.model} · {s.flatNumber}
                  </span>
                  <span style={{ fontSize: 13, opacity: 0.8 }}>{s.washRecordStatus ? STATUS_LABEL[s.washRecordStatus] : "○"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

const backButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
};
