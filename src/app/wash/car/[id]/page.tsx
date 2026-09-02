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
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/wash/today")} className="rounded-lg border border-line px-3 py-2 text-sm text-chalk">
          ← {t("car_back")}
        </button>
        <SyncStatus />
      </div>

      <input
        ref={beforeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onBeforeCapture(e.target.files[0])}
      />
      <input
        ref={afterInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onAfterCapture(e.target.files[0])}
      />
      <input
        ref={damageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
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
          <div className="text-center">
            <div className="font-display text-2xl font-extrabold uppercase tracking-tightest text-chalk">
              🚗 {stop.make ?? ""} {stop.model ?? ""}
            </div>
            <div className="mt-1 text-base text-muted">{stop.registrationNumber}</div>
          </div>

          {step === "detail" && (
            <>
              <InfoBlock label={t("car_parking")} value={`${stop.tower} · ${stop.flatNumber}`} />
              <BigButton icon="🧽" label={t("car_start_service")} onClick={onStartService} />
            </>
          )}

          {step === "before" && (
            <>
              <StepLabel text={t("car_step_1")} />
              <p className="text-center text-muted">{t("car_capture_before_body")}</p>
              <BigButton icon="📷" label={t("car_capture_before_title")} onClick={() => beforeInputRef.current?.click()} />
            </>
          )}

          {step === "before_saved" && (
            <>
              <p className="text-center text-lg text-chalk">{t("car_before_saved")}</p>
              <BigButton icon="→" label={t("car_continue")} onClick={() => setStep("wash")} />
            </>
          )}

          {step === "wash" && (
            <>
              <StepLabel text={t("car_step_2")} />
              <p className="text-center text-muted">{t("car_wash_body")}</p>
              <button className="self-center font-mono text-sm text-ice underline underline-offset-4">
                {t("car_view_sop")}
              </button>
              <BigButton icon="✅" label={t("car_washed")} onClick={() => setStep("after")} />
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
              <p className="text-center text-base text-chalk/90">
                {t("car_photo_before")} ✓ &nbsp; {t("car_photo_after")} ✓
              </p>
              <BigButton icon="✅" label={t("car_complete_service")} onClick={onCompleteService} />
            </>
          )}

          {step === "completed" && (
            <>
              <p className="wash-greeting text-center">{t("car_completed_title")}</p>
              <BigButton icon="→" label={t("car_next_car")} onClick={onNextCar} />
            </>
          )}

          {step !== "completed" && (
            <div className="mt-2">
              {!reportIssueOpen ? (
                <button onClick={() => setReportIssueOpen(true)} className="wash-btn-warn">
                  {t("car_report_issue")}
                </button>
              ) : (
                <div>
                  <p className="mb-2 text-sm text-muted">{t("car_exception_prompt")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <SmallButton icon="🚗" label={t("car_not_in_slot")} onClick={() => onException("not_in_slot")} />
                    <SmallButton icon="🚫" label={t("car_declined")} onClick={() => onException("declined")} />
                    <SmallButton icon="🚘" label={t("car_blocked")} onClick={() => onException("blocked")} />
                    <SmallButton icon="✨" label={t("car_already_clean")} onClick={() => onException("already_clean")} />
                    <SmallButton icon="⚠️" label={t("car_damage_flag")} onClick={onDamageCaptureClick} full />
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
      <div className="px-4 py-10 text-center">
        <div className="wash-greeting mb-3">{t("car_damage_flagged_title")}</div>
        <p className="mb-6 text-muted">{t("car_damage_flagged_body")}</p>
        <BigButton icon="←" label={t("car_back")} onClick={onDone} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-center font-display text-xl font-extrabold uppercase tracking-tightest text-sodium">
        ⚠ {t("car_damage_flag")}
      </div>
      <p className="mb-4 text-center text-muted">{t("car_damage_photo")}</p>
      <p className="mb-4 text-center text-chalk">{photoCount} 📷</p>
      <div className="flex flex-col gap-2.5">
        <SmallButton icon="📷" label={t("car_add_another_photo")} onClick={onAddAnother} full />
        <BigButton icon="⚠️" label={t("car_flag_damage_action")} onClick={onFlag} />
      </div>
    </div>
  );
}

function StepLabel({ text }: { text: string }) {
  return <div className="wash-eyebrow text-center">{text}</div>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4 text-center">
      <div className="wash-eyebrow">{label}</div>
      <div className="mt-1 text-xl font-semibold text-chalk">{value}</div>
    </div>
  );
}

function BigButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="wash-btn-primary flex-col gap-2 py-9 text-lg">
      <span className="text-5xl">{icon}</span>
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
    <button onClick={onClick} className={`wash-chip-btn ${full ? "col-span-2" : ""}`}>
      <span className="text-2xl">{icon}</span>
      {label}
    </button>
  );
}
