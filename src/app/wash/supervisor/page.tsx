"use client";

// Supervisor view is intentionally English-only, plain text — the brief's
// Hindi/English + icon-first requirement is scoped to worker-facing screens;
// supervisors are office/ops staff. Brand tokens/typography still apply for
// visual consistency with the rest of /wash and the marketing site.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  ClusterOverview,
  ReassignTarget,
  RewashItem,
  SpotCheckItem,
  WorkerCompletion,
  clearRewash,
  getClusterOverview,
  getReassignTargets,
  getRewashQueue,
  getSpotCheckQueue,
  getSupervisorOverview,
  reassignRoute,
} from "@/lib/wash-data";

export default function SupervisorPage() {
  const router = useRouter();
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [clusterOverview, setClusterOverview] = useState<ClusterOverview | null>(null);
  const [overview, setOverview] = useState<WorkerCompletion[]>([]);
  const [reassignTargets, setReassignTargets] = useState<Record<string, ReassignTarget[]>>({});
  const [spotCheck, setSpotCheck] = useState<SpotCheckItem[]>([]);
  const [rewash, setRewash] = useState<RewashItem[]>([]);

  const loadAll = async (cId: string) => {
    const [co, ov, sc, rw] = await Promise.all([
      getClusterOverview(cId),
      getSupervisorOverview(cId),
      getSpotCheckQueue(cId),
      getRewashQueue(cId),
    ]);
    setClusterOverview(co);
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
      setClusterId(session.clusterId);
      await loadAll(session.clusterId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const onReassign = async (routeId: string, newWorkerId: string) => {
    await reassignRoute(routeId, newWorkerId);
    if (clusterId) await loadAll(clusterId);
  };

  const onClearRewash = async (washRecordId: string) => {
    await clearRewash(washRecordId);
    if (clusterId) await loadAll(clusterId);
  };

  if (!clusterId || !clusterOverview) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 font-sans text-chalk">
      <h1 className="wash-heading mb-8">Supervisor</h1>

      <section className="mb-10">
        <h2 className="wash-eyebrow mb-3">Cluster overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="wash-card p-4">
            <div className="wash-eyebrow mb-2">Workers</div>
            <MiniStat label="Started" value={clusterOverview.startedCount} of={clusterOverview.workerCount} />
            <MiniStat
              label="Absent"
              value={clusterOverview.absentCount}
              of={clusterOverview.workerCount}
              colorClass="text-sodium"
            />
          </div>
          <div className="wash-card p-4">
            <div className="wash-eyebrow mb-2">Today</div>
            <MiniStat label="Completed" value={clusterOverview.carsCompleted} of={clusterOverview.carsAssigned} />
            <MiniStat
              label="Pending"
              value={clusterOverview.carsPending}
              of={clusterOverview.carsAssigned}
              colorClass="text-ice"
            />
            <MiniStat
              label="Issues"
              value={clusterOverview.carsIssues}
              of={clusterOverview.carsAssigned}
              colorClass="text-sodium"
            />
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="wash-eyebrow mb-3">Today's workers</h2>
        <div className="flex flex-col gap-2">
          {overview.map((w) => (
            <div key={w.workerId} className="wash-card flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-semibold text-chalk">
                  {w.workerName} {!w.hasStarted && <Badge>Not started</Badge>}
                </div>
                <div className="text-sm text-muted">
                  {w.societyName} · {w.doneCount}/{w.totalStops}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/wash/supervisor/worker/${w.workerId}`)}
                  className="rounded-lg border border-line px-3 py-2 text-sm text-chalk transition-colors duration-150 hover:border-accent"
                >
                  View route
                </button>
                {w.routeId && (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && onReassign(w.routeId!, e.target.value)}
                    className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-chalk"
                  >
                    <option value="" disabled>
                      Reassign to…
                    </option>
                    {(reassignTargets[w.workerId] ?? []).map((t) => (
                      <option key={t.workerId} value={t.workerId}>
                        {t.name} (+{t.currentLoad})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="wash-eyebrow mb-3">Quality spot-check ({spotCheck.length})</h2>
        <div className="flex flex-col gap-2">
          {spotCheck.map((s) => (
            <button
              key={s.washRecordId}
              onClick={() => router.push(`/wash/supervisor/quality/${s.washRecordId}`)}
              className="wash-card flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 hover:border-accent/40"
            >
              <div>
                <div className="font-semibold text-chalk">
                  {s.make} {s.model} · {s.tower} · Flat {s.flatNumber}
                </div>
                <div className="text-sm text-muted">{s.workerName}</div>
              </div>
              <span className="text-muted">→</span>
            </button>
          ))}
          {spotCheck.length === 0 && <p className="text-sm text-muted">Nothing pending.</p>}
        </div>
      </section>

      <section>
        <h2 className="wash-eyebrow mb-3">Re-wash queue ({rewash.length})</h2>
        <div className="flex flex-col gap-2">
          {rewash.map((r) => (
            <div key={r.washRecordId} className="wash-card flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-semibold text-chalk">
                  {r.tower} · Flat {r.flatNumber}
                  {r.priority && <PriorityBadge priority={r.priority} />}
                </div>
                <div className="text-sm text-muted">
                  {r.workerName}
                  {r.reason && ` · ${r.reason}`}
                </div>
              </div>
              <button
                onClick={() => onClearRewash(r.washRecordId)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink"
              >
                Cleared
              </button>
            </div>
          ))}
          {rewash.length === 0 && <p className="text-sm text-muted">Nothing pending.</p>}
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  of,
  colorClass,
}: {
  label: string;
  value: number;
  of: number;
  colorClass?: string;
}) {
  return (
    <div className="mb-1 flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${colorClass ?? "text-chalk"}`}>
        {value} / {of}
      </span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 rounded-full bg-sodium/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-sodium">
      {children}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colorClass: Record<string, string> = {
    high: "bg-sodium/20 text-sodium",
    normal: "bg-ice/15 text-ice",
    low: "bg-line text-muted",
  };
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] uppercase ${colorClass[priority] ?? "bg-line text-muted"}`}
    >
      {priority}
    </span>
  );
}
