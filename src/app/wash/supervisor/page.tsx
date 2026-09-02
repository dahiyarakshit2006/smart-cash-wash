"use client";

// Supervisor view is intentionally English-only, plain text — the brief's
// Hindi/English + icon-first requirement (section 5's sibling constraint)
// is scoped to worker-facing screens; supervisors are office/ops staff.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  ReassignTarget,
  RewashItem,
  SpotCheckItem,
  WorkerCompletion,
  clearRewash,
  getReassignTargets,
  getRewashQueue,
  getSpotCheckQueue,
  getSupervisorOverview,
  reassignRoute,
  signOff,
} from "@/lib/wash-data";

export default function SupervisorPage() {
  const router = useRouter();
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [overview, setOverview] = useState<WorkerCompletion[]>([]);
  const [reassignTargets, setReassignTargets] = useState<Record<string, ReassignTarget[]>>({});
  const [spotCheck, setSpotCheck] = useState<SpotCheckItem[]>([]);
  const [rewash, setRewash] = useState<RewashItem[]>([]);

  const loadAll = async (cId: string) => {
    const [ov, sc, rw] = await Promise.all([
      getSupervisorOverview(cId),
      getSpotCheckQueue(cId),
      getRewashQueue(cId),
    ]);
    setOverview(ov);
    setSpotCheck(sc);
    setRewash(rw);

    const targets: Record<string, ReassignTarget[]> = {};
    for (const w of ov) {
      targets[w.workerId] = await getReassignTargets(cId, w.workerId);
    }
    setReassignTargets(targets);
  };

  useEffect(() => {
    (async () => {
      const session = getSession();
      if (!session || session.role !== "supervisor") {
        router.replace("/wash/login");
        return;
      }
      setSupervisorId(session.workerId);
      setClusterId(session.clusterId);
      await loadAll(session.clusterId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const onReassign = async (routeId: string, newWorkerId: string) => {
    await reassignRoute(routeId, newWorkerId);
    if (clusterId) await loadAll(clusterId);
  };

  const onApprove = async (washRecordId: string) => {
    if (!supervisorId || !clusterId) return;
    await signOff(washRecordId, supervisorId, false);
    await loadAll(clusterId);
  };

  const onNeedsRewash = async (washRecordId: string) => {
    if (!supervisorId || !clusterId) return;
    await signOff(washRecordId, supervisorId, true);
    await loadAll(clusterId);
  };

  const onClearRewash = async (washRecordId: string) => {
    await clearRewash(washRecordId);
    if (clusterId) await loadAll(clusterId);
  };

  if (!supervisorId) return null;

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Supervisor</h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={sectionTitle}>Today's workers</h2>
        {overview.map((w) => (
          <div key={w.workerId} style={rowStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {w.workerName} {!w.hasStarted && <span style={badgeStyle}>Not started</span>}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {w.societyName} · {w.doneCount}/{w.totalStops}
              </div>
            </div>
            {w.routeId && (
              <select
                defaultValue=""
                onChange={(e) => e.target.value && onReassign(w.routeId!, e.target.value)}
                style={selectStyle}
              >
                <option value="" disabled>
                  Reassign to…
                </option>
                {(reassignTargets[w.workerId] ?? []).map((t) => (
                  <option key={t.workerId} value={t.workerId}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={sectionTitle}>Quality spot-check ({spotCheck.length})</h2>
        {spotCheck.map((s) => (
          <div key={s.washRecordId} style={rowStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {s.tower} · Flat {s.flatNumber}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{s.workerName}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onApprove(s.washRecordId)} style={approveButtonStyle}>
                ✅ Approve
              </button>
              <button onClick={() => onNeedsRewash(s.washRecordId)} style={rewashButtonStyle}>
                🔁 Re-wash
              </button>
            </div>
          </div>
        ))}
        {spotCheck.length === 0 && <p style={emptyStyle}>Nothing pending.</p>}
      </section>

      <section>
        <h2 style={sectionTitle}>Re-wash queue ({rewash.length})</h2>
        {rewash.map((r) => (
          <div key={r.washRecordId} style={rowStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {r.tower} · Flat {r.flatNumber}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{r.workerName}</div>
            </div>
            <button onClick={() => onClearRewash(r.washRecordId)} style={approveButtonStyle}>
              Cleared
            </button>
          </div>
        ))}
        {rewash.length === 0 && <p style={emptyStyle}>Nothing pending.</p>}
      </section>
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 16, opacity: 0.8, marginBottom: 10 };
const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #2a2a2c",
  background: "#1a1a1c",
  color: "#fff",
  marginBottom: 8,
};
const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#7c2d12",
  color: "#fed7aa",
};
const selectStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  background: "#0b0b0c",
  color: "#fff",
  border: "1px solid #333",
};
const approveButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#22c55e",
  color: "#fff",
};
const rewashButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#f59e0b",
  color: "#000",
};
const emptyStyle: React.CSSProperties = { opacity: 0.5, fontSize: 14 };
