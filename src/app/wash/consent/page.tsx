"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptConsent, getSession } from "@/lib/auth";
import { useT, LangToggle } from "@/lib/i18n";

export default function ConsentPage() {
  const t = useT();
  const router = useRouter();
  const [geoConsent, setGeoConsent] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) router.replace("/wash/login");
  }, [router]);

  const onAccept = async () => {
    const session = getSession();
    if (!session) return;
    await acceptConsent(session.workerId, geoConsent);
    router.push("/wash/route");
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <LangToggle />
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 24 }}>{t("consent_title")}</h1>

      <p style={{ marginBottom: 16, lineHeight: 1.6 }}>{t("consent_body_1")}</p>
      <p style={{ marginBottom: 24, lineHeight: 1.6 }}>{t("consent_body_2")}</p>

      <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <input
          type="checkbox"
          checked={geoConsent}
          onChange={(e) => setGeoConsent(e.target.checked)}
          style={{ width: 24, height: 24 }}
        />
        <span>{t("consent_geo_toggle")}</span>
      </label>

      <button
        onClick={onAccept}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: 18,
          borderRadius: 8,
          border: "none",
          background: "#3b82f6",
          color: "#fff",
        }}
      >
        {t("consent_accept")}
      </button>
    </div>
  );
}
