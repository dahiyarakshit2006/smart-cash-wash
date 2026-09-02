"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/auth";
import { useT, LangToggle } from "@/lib/i18n";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSendOtp = async () => {
    setError(null);
    const result = await requestOtp(phone);
    if (!result.ok) {
      setError(t("login_not_registered"));
      return;
    }
    setOtpSent(true);
  };

  const onVerify = async () => {
    setError(null);
    const result = await verifyOtp(phone, code);
    if (!result.ok) {
      setError(t("login_invalid_code"));
      return;
    }
    router.push("/wash/consent");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <span className="font-display text-lg font-extrabold uppercase tracking-tightest text-chalk">
          DHRUVA <span className="text-muted">WASH</span>
        </span>
        <LangToggle />
      </div>

      <h1 className="wash-heading mb-8">{t("login_title")}</h1>

      {!otpSent ? (
        <>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("login_phone_placeholder")}
            className="wash-field mb-4"
          />
          <button onClick={onSendOtp} className="wash-btn-primary" disabled={phone.length < 10}>
            {t("login_send_otp")}
          </button>
        </>
      ) : (
        <>
          <p className="wash-eyebrow mb-3">{t("login_enter_otp")}</p>
          <input
            type="tel"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="wash-field mb-4"
          />
          <button onClick={onVerify} className="wash-btn-primary" disabled={code.length !== 6}>
            {t("login_verify")}
          </button>
        </>
      )}

      {error && <p className="mt-4 text-sm text-sodium">{error}</p>}
    </div>
  );
}
