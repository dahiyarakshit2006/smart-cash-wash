"use client";

// Internal test harness for the offline photo queue module. Not part of the
// worker-facing product — exists only to verify zero-data-loss behavior
// across offline enqueue / app kill / reload before any real UI is built
// on top of this module, per the build-order gate. Safe to delete once the
// real per-car camera flow (task #6) supersedes it.

import { useEffect, useState } from "react";
import { enqueuePhoto, initPhotoQueue, processQueue } from "@/lib/photo-queue/queue";
import { QueuedPhoto, getAllPhotos } from "@/lib/photo-queue/db";

export default function QueueTestPage() {
  const [photos, setPhotos] = useState<QueuedPhoto[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = (msg: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()} ${msg}`, ...l].slice(0, 50));

  const refresh = async () => {
    const all = await getAllPhotos();
    setPhotos(all);
  };

  useEffect(() => {
    initPhotoQueue();
    refresh();
    const interval = setInterval(refresh, 2000);
    // test-only hook: lets the browser-automation harness enqueue a photo
    // directly, bypassing React's synthetic file-input change event, which
    // programmatic DOM file assignment doesn't reliably trigger.
    (window as any).__enqueueTest = async (file: File) => {
      appendLog(`enqueue start, source ${(file.size / 1024).toFixed(0)}KB`);
      const id = await enqueuePhoto({ washRecordId: "test-wash-record", slot: "before", file });
      appendLog(`enqueued ${id}`);
      await refresh();
      return id;
    };
    return () => clearInterval(interval);
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    appendLog(`enqueue start, source ${(file.size / 1024).toFixed(0)}KB`);
    const id = await enqueuePhoto({
      washRecordId: "test-wash-record",
      slot: "before",
      file,
    });
    appendLog(`enqueued ${id}`);
    refresh();
  };

  const onManualFlush = async () => {
    appendLog("manual flush triggered");
    const result = await processQueue();
    appendLog(`flush result: ${result.succeeded} succeeded, ${result.failed} failed`);
    refresh();
  };

  return (
    <div style={{ padding: 24, fontFamily: "monospace", color: "#eee", background: "#111", minHeight: "100vh" }}>
      <h1>Photo Queue Test Harness</h1>
      <p>navigator.onLine: {String(typeof navigator !== "undefined" ? navigator.onLine : "?")}</p>
      <input type="file" accept="image/*" onChange={onFile} />
      <button onClick={onManualFlush} style={{ marginLeft: 12 }}>
        Manual flush (retry fallback)
      </button>
      <button onClick={refresh} style={{ marginLeft: 12 }}>
        Refresh
      </button>

      <h2>Queue ({photos.length})</h2>
      <ul>
        {photos.map((p) => (
          <li key={p.id}>
            {p.id.slice(0, 8)} — slot={p.slot} status={p.status} attempts={p.attempts} size=
            {(p.blob.size / 1024).toFixed(0)}KB capturedAt={p.capturedAt}
          </li>
        ))}
      </ul>

      <h2>Log</h2>
      <ul>
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
