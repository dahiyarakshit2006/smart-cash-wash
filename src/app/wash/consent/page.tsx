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
    router.push(session.role === "supervisor" ? "/wash/supervisor" : "/wash/today");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-8">
      <div className="mb-8 flex justify-end">
        <LangToggle />
      </div>

      <h1 className="wash-heading mb-6">{t("consent_title")}</h1>

      <p className="mb-4 leading-relaxed text-chalk/90">{t("consent_body_1")}</p>
      <p className="mb-8 leading-relaxed text-muted">{t("consent_body_2")}</p>

      <label className="wash-card mb-8 flex items-center gap-4 px-5 py-4">
        <input
          type="checkbox"
          checked={geoConsent}
          onChange={(e) => setGeoConsent(e.target.checked)}
          className="h-6 w-6 accent-accent"
        />
        <span className="text-chalk">{t("consent_geo_toggle")}</span>
      </label>

      <button onClick={onAccept} className="wash-btn-primary">
        {t("consent_accept")}
      </button>
    </div>
  );
}
