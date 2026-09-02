"use client";

// Small, non-blocking status line. Never a spinner, never blocks
// interaction — just tells the worker whether everything is saved.

import { useEffect, useState } from "react";
import { getUnsyncedCount } from "@/lib/photo-queue/db";
import { useT } from "@/lib/i18n";

export function SyncStatus() {
  const t = useT();
  const [unsynced, setUnsynced] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => getUnsyncedCount().then(setUnsynced);
    update();
    const interval = setInterval(update, 3000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const allSaved = unsynced === 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        opacity: 0.75,
      }}
    >
      <span style={{ color: allSaved ? "#22c55e" : "#f59e0b" }}>{allSaved ? "●" : "○"}</span>
      {allSaved ? t("sync_all_saved") : online ? t("sync_saving") : t("sync_offline_saved")}
    </div>
  );
}
