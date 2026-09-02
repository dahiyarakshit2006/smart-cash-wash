"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, hasAcceptedConsent } from "@/lib/auth";

export default function WashRoot() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = getSession();
      if (!session) {
        router.replace("/wash/login");
        return;
      }
      const consented = await hasAcceptedConsent(session.workerId);
      if (!consented) {
        router.replace("/wash/consent");
        return;
      }
      router.replace(session.role === "supervisor" ? "/wash/supervisor" : "/wash/today");
    })();
  }, [router]);

  return null;
}
