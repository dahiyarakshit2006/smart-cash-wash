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
    <div style={{ padding: 16, maxWidth: 560, margin: "0 auto", fontFamily: "sans-serif", color: "#fff" }}>
      <button onClick={() => router.push("/wash/supervisor")} style={backButtonStyle}>
        ← Back
      </button>

      <h1 style={{ fontSize: 20, margin: "16px 0 4px" }}>
        {detail.make} {detail.model}
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        {detail.tower} · Flat {detail.flatNumber} · {detail.workerName}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <PhotoBlock label="Before" url={images.before} />
        <PhotoBlock label="After" url={images.after} />
      </div>

      {!rewashMode ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onApprove} style={approveButtonStyle}>
            ✅ Approved
          </button>
          <button onClick={() => setRewashMode(true)} style={rewashButtonStyle}>
            🔁 Re-wash
          </button>
          <button style={investigateButtonStyle}>🔎 Investigate</button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Reason</p>
          <select value={reason} onChange={(e) => setReason(e.target.value as RewashReason)} style={selectStyle}>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <p style={{ fontSize: 13, opacity: 0.7, margin: "14px 0 6px" }}>Priority</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: priority === p ? "2px solid #f59e0b" : "1px solid #333",
                  background: priority === p ? "#3a2a10" : "#1a1a1c",
                  color: "#fff",
                  textTransform: "capitalize",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button onClick={onConfirmRewash} style={rewashButtonStyle}>
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
      <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>{label}</p>
      <div
        style={{
          aspectRatio: "4/3",
          borderRadius: 10,
          background: "#1a1a1c",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ opacity: 0.4, fontSize: 12 }}>No photo</span>
        )}
      </div>
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
const approveButtonStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  border: "none",
  background: "#22c55e",
  color: "#fff",
  fontSize: 16,
};
const rewashButtonStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  border: "none",
  background: "#f59e0b",
  color: "#000",
  fontSize: 16,
};
const investigateButtonStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
  fontSize: 16,
};
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  background: "#0b0b0c",
  color: "#fff",
  border: "1px solid #333",
};
