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
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <LangToggle />
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 24 }}>{t("login_title")}</h1>

      {!otpSent ? (
        <>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("login_phone_placeholder")}
            style={inputStyle}
          />
          <button onClick={onSendOtp} style={buttonStyle} disabled={phone.length < 10}>
            {t("login_send_otp")}
          </button>
        </>
      ) : (
        <>
          <p style={{ marginBottom: 12 }}>{t("login_enter_otp")}</p>
          <input
            type="tel"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            style={inputStyle}
          />
          <button onClick={onVerify} style={buttonStyle} disabled={code.length !== 6}>
            {t("login_verify")}
          </button>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 16 }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  fontSize: 20,
  marginBottom: 16,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1c",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  fontSize: 18,
  borderRadius: 8,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
};
