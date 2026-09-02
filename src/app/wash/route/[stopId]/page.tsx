"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  ExceptionStatus,
  StopDetail,
  flagDamage,
  getRouteStopDetail,
  markDone,
  openCar,
  setExceptionStatus,
  setPhotoKey,
} from "@/lib/wash-data";
import { enqueuePhoto } from "@/lib/photo-queue/queue";
import { useT } from "@/lib/i18n";

type Step = "before" | "after" | "ready";
type DamageStep = "closed" | "choosing" | "capturing";

export default function CarPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ stopId: string }>();

  const [stop, setStop] = useState<StopDetail | null>(null);
  const [washRecordId, setWashRecordId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("before");
  const [damageStep, setDamageStep] = useState<DamageStep>("closed");
  const [damagePreExisting, setDamagePreExisting] = useState<boolean | null>(null);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const damageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const session = getSession();
      if (!session) {
        router.replace("/wash/login");
        return;
      }
      setWorkerId(session.workerId);

      const detail = await getRouteStopDetail(params.stopId);
      if (!detail) {
        router.replace("/wash/route");
        return;
      }
      setStop(detail);

      const recordId = await openCar(detail.routeStopId, session.workerId, detail.vehicleId);
      setWashRecordId(recordId);
    })();
  }, [params.stopId, router]);

  const onBeforeCapture = async (file: File) => {
    if (!washRecordId) return;
    const id = await enqueuePhoto({ washRecordId, slot: "before", file });
    await setPhotoKey(washRecordId, "before", `${washRecordId}/before-${id}.jpg`);
    setStep("after");
  };

  const onAfterCapture = async (file: File) => {
    if (!washRecordId) return;
    const id = await enqueuePhoto({ washRecordId, slot: "after", file });
    await setPhotoKey(washRecordId, "after", `${washRecordId}/after-${id}.jpg`);
    setStep("ready");
  };

  const onDone = async () => {
    if (!washRecordId) return;
    await markDone(washRecordId);
    router.push("/wash/route");
  };

  const onException = async (status: ExceptionStatus) => {
    if (!washRecordId) return;
    await setExceptionStatus(washRecordId, status);
    router.push("/wash/route");
  };

  const onDamageChoice = (preExisting: boolean) => {
    setDamagePreExisting(preExisting);
    setDamageStep("capturing");
    // Camera launch must follow directly from this tap (user gesture) or
    // the browser will block the native camera picker from opening.
    damageInputRef.current?.click();
  };

  const onDamageCapture = async (file: File) => {
    if (!washRecordId || !stop || !workerId || damagePreExisting === null) return;
    const id = await enqueuePhoto({ washRecordId, slot: "damage", file });
    await flagDamage({
      washRecordId,
      vehicleId: stop.vehicleId,
      workerId,
      preExisting: damagePreExisting,
      photoKeys: [`${washRecordId}/damage-${id}.jpg`],
    });
    setDamageStep("closed");
    setDamagePreExisting(null);
  };

  if (!stop || !washRecordId) return null;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={() => router.push("/wash/route")} style={backButtonStyle}>
        ← {t("car_back")}
      </button>

      <div style={{ fontSize: 24, fontWeight: 700, textAlign: "center" }}>
        🚗 {t("route_flat")} {stop.flatNumber}
      </div>

      {/* Per-car loop: before -> after -> done */}
      {step === "before" && (
        <BigButton icon="📷" label={t("car_photo_before")} onClick={() => beforeInputRef.current?.click()} />
      )}
      {step === "after" && (
        <BigButton icon="📷" label={t("car_photo_after")} onClick={() => afterInputRef.current?.click()} />
      )}
      {step === "ready" && (
        <BigButton icon="✅" label={t("car_done")} onClick={onDone} highlight />
      )}

      <input
        ref={beforeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onBeforeCapture(e.target.files[0])}
      />
      <input
        ref={afterInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onAfterCapture(e.target.files[0])}
      />
      <input
        ref={damageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onDamageCapture(e.target.files[0])}
      />

      {/* One-tap exceptions — always reachable, same speed as marking done */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <SmallButton icon="❌" label={t("car_not_in_slot")} onClick={() => onException("not_in_slot")} />
        <SmallButton icon="🚫" label={t("car_declined")} onClick={() => onException("declined")} />
        <SmallButton icon="⛔" label={t("car_blocked")} onClick={() => onException("blocked")} />
        <SmallButton icon="✨" label={t("car_already_clean")} onClick={() => onException("already_clean")} />
      </div>

      {/* Two-tap pre-wash damage flag */}
      {damageStep === "closed" && (
        <SmallButton icon="⚠️" label={t("car_damage_flag")} onClick={() => setDamageStep("choosing")} full />
      )}
      {damageStep === "choosing" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <SmallButton icon="🕰️" label={t("car_damage_pre_existing")} onClick={() => onDamageChoice(true)} />
          <SmallButton icon="⚠️" label={t("car_damage_new")} onClick={() => onDamageChoice(false)} />
        </div>
      )}
    </div>
  );
}

function BigButton({
  icon,
  label,
  onClick,
  highlight,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "40px 16px",
        borderRadius: 16,
        border: "none",
        background: highlight ? "#22c55e" : "#3b82f6",
        color: "#fff",
        fontSize: 20,
      }}
    >
      <span style={{ fontSize: 48 }}>{icon}</span>
      {label}
    </button>
  );
}

function SmallButton({
  icon,
  label,
  onClick,
  full,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        gridColumn: full ? "1 / -1" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "16px 8px",
        borderRadius: 12,
        border: "1px solid #333",
        background: "#1a1a1c",
        color: "#fff",
        fontSize: 14,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      {label}
    </button>
  );
}

const backButtonStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
};
