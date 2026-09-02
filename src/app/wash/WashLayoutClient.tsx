"use client";

import { useEffect } from "react";
import { LangProvider } from "@/lib/i18n";
import { initPhotoQueue } from "@/lib/photo-queue/queue";

export default function WashLayoutClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPhotoQueue();
  }, []);

  return (
    <LangProvider>
      <div className="min-h-screen bg-ink font-sans text-chalk">{children}</div>
    </LangProvider>
  );
}
