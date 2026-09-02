"use client";

import { useEffect } from "react";
import { LangProvider } from "@/lib/i18n";
import { initPhotoQueue } from "@/lib/photo-queue/queue";

export default function WashLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPhotoQueue();
  }, []);

  return (
    <LangProvider>
      <div style={{ minHeight: "100vh", background: "#0b0b0c", color: "#f5f5f5" }}>{children}</div>
    </LangProvider>
  );
}
