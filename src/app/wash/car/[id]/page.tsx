"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  ExceptionStatus,
  StopDetail,
  flagDamage,
  getNextStop,
  getRouteStopDetail,
  getTodayRoute,
  markDone,
  openCar,
  setExceptionStatus,
  setPhotoKey,
} from "@/lib/wash-data";
import { enqueuePhoto } from "@/lib/photo-queue/queue";
import { useT } from "@/lib/i18n";
import { SyncStatus } from "@/components/SyncStatus";

type Step = "detail" | "before" | "before_saved" | "wash" | "after" | "ready" | "completed";

export default function CarPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [stop, setStop] = useState<StopDetail | null>(null);
  const [washRecordId, setWashRecordId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("detail");

  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [damageCapturing, setDamageCapturing] = useState(false);
  const [damagePhotoIds, setDamagePhotoIds] = useState<string[]>([]);
  const [damageFlagged, setDamageFlagged] = useState(false);

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

      const detail = await getRouteStopDetail(params.id);
      if (!detail) {
        router.replace("/wash/today");
        return;
      }
      setStop(detail);
      if (detail.washRecordStatus === "done") setStep("completed");
    })();
  }, [params.id, router]);

  const ensureWashRecord = async (): Promise<string | null> => {
    if (washRecordId) return washRecordId;
    if (!stop || !workerId) return null;
    const id = await openCar(stop.routeStopId, workerId, stop.vehicleId);
    setWashRecordId(id);
    return id;
  };

  const onStartService = async () => {
    await ensureWashRecord();
    setStep("before");
  };

  const onBeforeCapture = async (file: File) => {
    const recordId = await ensureWashRecord();
    if (!recordId) return;
    const id = await enqueuePhoto({ washRecordId: recordId, slot: "before", file });
    await setPhotoKey(recordId, "before", `${recordId}/before-${id}.jpg`);
    setStep("before_saved");
  };

  const onAfterCapture = async (file: File) => {
    if (!washRecordId) return;
    const id = await enqueuePhoto({ washRecordId, slot: "after", file });
    await setPhotoKey(washRecordId, "after", `${washRecordId}/after-${id}.jpg`);
    setStep("ready");
  };

  const onCompleteService = async () => {
    if (!washRecordId) return;
    await markDone(washRecordId);
    setStep("completed");
  };

  const onNextCar = async () => {
    const session = getSession();
    if (!session) return;
    const route = await getTodayRoute(session.workerId);
    const next = route ? getNextStop(route) : null;
    router.push(next ? `/wash/car/${next.routeStopId}` : "/wash/today");
  };

  const onException = async (status: ExceptionStatus) => {
    const recordId = await ensureWashRecord();
    if (!recordId) return;
    await setExceptionStatus(recordId, status);
    router.push("/wash/today");
  };

  const onDamageCaptureClick = () => {
    setReportIssueOpen(false);
    setDamageCapturing(true);
    damageInputRef.current?.click();
  };

  const onDamagePhoto = async (file: File) => {
    const recordId = await ensureWashRecord();
    if (!recordId || !stop || !workerId) return;
    const id = await enqueuePhoto({ washRecordId: recordId, slot: "damage", file });
    setDamagePhotoIds((prev) => [...prev, `${recordId}/damage-${id}.jpg`]);
  };

  const onAddAnotherDamagePhoto = () => {
    damageInputRef.current?.click();
  };

  const onFlagDamage = async () => {
    const recordId = await ensureWashRecord();
    if (!recordId || !stop || !workerId) return;
    await flagDamage({
      washRecordId: recordId,
      vehicleId: stop.vehicleId,
      workerId,
      preExisting: false,
      photoKeys: damagePhotoIds,
    });
    setDamageFlagged(true);
  };

  if (!stop) return null;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.push("/wash/today")} style={backButtonStyle}>
          ← {t("car_back")}
        </button>
        <SyncStatus />
      </div>

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
        onChange={(e) => e.target.files?.[0] && onDamagePhoto(e.target.files[0])}
      />

      {damageCapturing ? (
        <DamagePanel
          flagged={damageFlagged}
          photoCount={damagePhotoIds.length}
          onAddAnother={onAddAnotherDamagePhoto}
          onFlag={onFlagDamage}
          onDone={() => router.push("/wash/today")}
        />
      ) : (
        <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              🚗 {stop.make ?? ""} {stop.model ?? ""}
            </div>
            <div style={{ fontSize: 15, opacity: 0.7, marginTop: 4 }}>{stop.registrationNumber}</div>
          </div>

          {step === "detail" && (
            <>
              <InfoBlock label={t("car_parking")} value={`${stop.tower} · ${stop.flatNumber}`} />
              <BigButton icon="🧽" label={t("car_start_service")} onClick={onStartService} highlight />
            </>
          )}

          {step === "before" && (
            <>
              <StepLabel text={t("car_step_1")} />
              <p style={{ textAlign: "center", opacity: 0.7 }}>{t("car_capture_before_body")}</p>
              <BigButton icon="📷" label={t("car_capture_before_title")} onClick={() => beforeInputRef.current?.click()} />
            </>
          )}

          {step === "before_saved" && (
            <>
              <p style={{ textAlign: "center", fontSize: 18 }}>{t("car_before_saved")}</p>
              <BigButton icon="→" label={t("car_continue")} onClick={() => setStep("wash")} highlight />
            </>
          )}

          {step === "wash" && (
            <>
              <StepLabel text={t("car_step_2")} />
              <p style={{ textAlign: "center", opacity: 0.7 }}>{t("car_wash_body")}</p>
              <button style={linkButtonStyle}>{t("car_view_sop")}</button>
              <BigButton icon="✅" label={t("car_washed")} onClick={() => setStep("after")} highlight />
            </>
          )}

          {step === "after" && (
            <>
              <StepLabel text={t("car_step_3")} />
              <BigButton icon="📷" label={t("car_capture_after_title")} onClick={() => afterInputRef.current?.click()} />
            </>
          )}

          {step === "ready" && (
            <>
              <p style={{ textAlign: "center", fontSize: 16, opacity: 0.8 }}>
                {t("car_photo_before")} ✓ &nbsp; {t("car_photo_after")} ✓
              </p>
              <BigButton icon="✅" label={t("car_complete_service")} onClick={onCompleteService} highlight />
            </>
          )}

          {step === "completed" && (
            <>
              <p style={{ textAlign: "center", fontSize: 22 }}>{t("car_completed_title")}</p>
              <BigButton icon="→" label={t("car_next_car")} onClick={onNextCar} highlight />
            </>
          )}

          {step !== "completed" && (
            <div style={{ marginTop: 8 }}>
              {!reportIssueOpen ? (
                <button onClick={() => setReportIssueOpen(true)} style={reportIssueButtonStyle}>
                  {t("car_report_issue")}
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>{t("car_exception_prompt")}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <SmallButton icon="🚗" label={t("car_not_in_slot")} onClick={() => onException("not_in_slot")} />
                    <SmallButton icon="🚫" label={t("car_declined")} onClick={() => onException("declined")} />
                    <SmallButton icon="🚘" label={t("car_blocked")} onClick={() => onException("blocked")} />
                    <SmallButton icon="✨" label={t("car_already_clean")} onClick={() => onException("already_clean")} />
                    <SmallButton
                      icon="⚠️"
                      label={t("car_damage_flag")}
                      onClick={onDamageCaptureClick}
                      full
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DamagePanel({
  flagged,
  photoCount,
  onAddAnother,
  onFlag,
  onDone,
}: {
  flagged: boolean;
  photoCount: number;
  onAddAnother: () => void;
  onFlag: () => void;
  onDone: () => void;
}) {
  const t = useT();

  if (flagged) {
    return (
      <div style={{ textAlign: "center", padding: "40px 16px" }}>
        <div style={{ fontSize: 22, marginBottom: 12 }}>{t("car_damage_flagged_title")}</div>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>{t("car_damage_flagged_body")}</p>
        <BigButton icon="←" label={t("car_back")} onClick={onDone} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", fontSize: 20, marginBottom: 16 }}>⚠ {t("car_damage_flag")}</div>
      <p style={{ textAlign: "center", opacity: 0.7, marginBottom: 16 }}>{t("car_damage_photo")}</p>
      <p style={{ textAlign: "center", marginBottom: 16 }}>{photoCount} 📷</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SmallButton icon="📷" label={t("car_add_another_photo")} onClick={onAddAnother} full />
        <BigButton icon="⚠️" label={t("car_flag_damage_action")} onClick={onFlag} highlight />
      </div>
    </div>
  );
}

function StepLabel({ text }: { text: string }) {
  return <div style={{ textAlign: "center", fontSize: 13, opacity: 0.6, letterSpacing: 1 }}>{text.toUpperCase()}</div>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
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
        padding: "36px 16px",
        borderRadius: 16,
        border: "none",
        background: highlight ? "#22c55e" : "#3b82f6",
        color: "#fff",
        fontSize: 19,
      }}
    >
      <span style={{ fontSize: 44 }}>{icon}</span>
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
        fontSize: 13,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      {label}
    </button>
  );
}

const backButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
};

const linkButtonStyle: React.CSSProperties = {
  alignSelf: "center",
  background: "none",
  border: "none",
  color: "#3b82f6",
  fontSize: 14,
  textDecoration: "underline",
};

const reportIssueButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #7c2d12",
  background: "#2a1610",
  color: "#fca5a5",
  fontSize: 14,
};
