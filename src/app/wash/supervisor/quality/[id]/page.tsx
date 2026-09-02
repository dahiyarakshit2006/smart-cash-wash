"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPhotoSignedUrls, RewashPriority, RewashReason, signOff } from "@/lib/wash-data";
import { supabase } from "@/lib/supabase";

interface Detail {
  workerName: string;
  flatNumber: string;
  tower: string;
  make: string | null;
  model: string | null;
  photoBeforeKey: string | null;
  photoAfterKey: string | null;
}

const REASONS: { value: RewashReason; label: string }[] = [
  { value: "not_clean", label: "Not cleaned properly" },
  { value: "missed_spot", label: "Missed a spot" },
  { value: "customer_complaint", label: "Customer complaint" },
  { value: "other", label: "Other" },
];
const PRIORITIES: RewashPriority[] = ["low", "normal", "high"];

export default function QualityCheckPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [images, setImages] = useState<{ before: string | null; after: string | null }>({
    before: null,
    after: null,
  });
  const [rewashMode, setRewashMode] = useState(false);
  const [reason, setReason] = useState<RewashReason>("not_clean");
  const [priority, setPriority] = useState<RewashPriority>("normal");

  useEffect(() => {
    (async () => {
      const session = getSession();
      if (!session || session.role !== "supervisor") {
        router.replace("/wash/login");
        return;
      }
      setSupervisorId(session.workerId);

      const { data } = await supabase
        .from("wash_record")
        .select(
          `photo_before_key, photo_after_key,
           worker:worker_id(name),
           route_stop:route_stop_id(tower, vehicle:vehicle_id(flat_number, make, model))`
        )
        .eq("id", params.id)
        .maybeSingle();

      if (!data) {
        router.replace("/wash/supervisor");
        return;
      }
      const worker = Array.isArray(data.worker) ? data.worker[0] : data.worker;
      const stop = Array.isArray(data.route_stop) ? data.route_stop[0] : data.route_stop;
      const vehicle = Array.isArray(stop?.vehicle) ? stop.vehicle[0] : stop?.vehicle;

      setDetail({
        workerName: (worker as { name: string })?.name ?? "",
        flatNumber: (vehicle as { flat_number: string })?.flat_number ?? "",
        tower: (stop as { tower: string })?.tower ?? "",
        make: (vehicle as { make: string | null })?.make ?? null,
        model: (vehicle as { model: string | null })?.model ?? null,
        photoBeforeKey: data.photo_before_key,
        photoAfterKey: data.photo_after_key,
      });

      const urls = await getPhotoSignedUrls(data.photo_before_key, data.photo_after_key);
      setImages(urls);
    })();
  }, [params.id, router]);

  const onApprove = async () => {
    if (!supervisorId) return;
    await signOff(params.id, supervisorId, false);
    router.push("/wash/supervisor");
  };

  const onConfirmRewash = async () => {
    if (!supervisorId) return;
    await signOff(params.id, supervisorId, true, { reason, priority });
    router.push("/wash/supervisor");
  };

  if (!detail) return null;

  return (
    <div className="mx-auto max-w-xl px-6 py-8 font-sans text-chalk">
      <button
        onClick={() => router.push("/wash/supervisor")}
        className="rounded-lg border border-line px-3 py-2 text-sm text-chalk"
      >
        ← Back
      </button>

      <h1 className="mb-1 mt-4 font-display text-xl font-extrabold uppercase tracking-tightest">
        {detail.make} {detail.model}
      </h1>
      <p className="mb-6 text-muted">
        {detail.tower} · Flat {detail.flatNumber} · {detail.workerName}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <PhotoBlock label="Before" url={images.before} />
        <PhotoBlock label="After" url={images.after} />
      </div>

      {!rewashMode ? (
        <div className="flex flex-col gap-2.5">
          <button onClick={onApprove} className="rounded-xl bg-accent px-4 py-4 text-base font-semibold text-ink">
            ✅ Approved
          </button>
          <button
            onClick={() => setRewashMode(true)}
            className="rounded-xl bg-sodium px-4 py-4 text-base font-semibold text-ink"
          >
            🔁 Re-wash
          </button>
          <button className="rounded-xl border border-line px-4 py-4 text-base text-chalk">🔎 Investigate</button>
        </div>
      ) : (
        <div>
          <p className="wash-eyebrow mb-2">Reason</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as RewashReason)}
            className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-chalk"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <p className="wash-eyebrow mb-2 mt-4">Priority</p>
          <div className="mb-6 flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg px-3 py-2.5 capitalize transition-colors duration-150 ${
                  priority === p ? "border-2 border-sodium bg-sodium/15 text-sodium" : "border border-line bg-raised text-chalk"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button onClick={onConfirmRewash} className="w-full rounded-xl bg-sodium px-4 py-4 text-base font-semibold text-ink">
            Confirm re-wash
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoBlock({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-raised">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted">No photo</span>
        )}
      </div>
    </div>
  );
}
