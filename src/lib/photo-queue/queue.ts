// Public API for the offline photo queue. UI code (built later, per the
// build order) should only ever call enqueuePhoto() — it must never see a
// loading/failure/retry state, per the brief's "tapping done must feel
// instant" constraint. Everything past that point is this module's problem.

import { supabase } from "@/lib/supabase";
import { compressPhoto } from "./compress";
import {
  QueuedPhoto,
  deletePhoto,
  getPendingPhotos,
  getPhotosAwaitingCompression,
  putPhoto,
  replacePhotoBlob,
  setSyncConfig,
  updatePhotoStatus,
} from "./db";

const SYNC_TAG = "wash-photo-queue-sync";
const MANUAL_RETRY_INTERVAL_MS = 20_000;
const STORAGE_BUCKET = "wash-photos";

let manualRetryTimer: ReturnType<typeof setInterval> | null = null;

export async function enqueuePhoto(params: {
  washRecordId: string;
  slot: "before" | "after" | "damage";
  file: Blob;
}): Promise<string> {
  const id = crypto.randomUUID();

  // Raw blob written first — compression of a ~4MB photo can take several
  // seconds (measured ~1-6s depending on device), which would blow the
  // "tapping done must feel instant" constraint if done before this write.
  // Compression happens after this promise resolves, in the background.
  const photo: QueuedPhoto = {
    id,
    washRecordId: params.washRecordId,
    slot: params.slot,
    blob: params.file,
    capturedAt: new Date().toISOString(),
    status: "pending_compression",
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  await putPhoto(photo);

  compressAndPromote(id, params.file);

  return id;
}

async function compressAndPromote(id: string, file: Blob): Promise<void> {
  try {
    const { blob, capturedAt } = await compressPhoto(file);
    await replacePhotoBlob(id, blob, capturedAt);
    triggerSync();
  } catch {
    // Compression failure leaves the record at pending_compression. It will
    // be retried on the next processCompressionQueue() pass (app resume,
    // 'online' event, or manual retry fallback tick) rather than lost.
  }
}

async function processCompressionQueue(): Promise<void> {
  const awaiting = await getPhotosAwaitingCompression();
  for (const photo of awaiting) {
    await compressAndPromote(photo.id, photo.blob);
  }
}

async function uploadOne(photo: QueuedPhoto): Promise<void> {
  await updatePhotoStatus(photo.id, "uploading");
  const objectPath = `${photo.washRecordId}/${photo.slot}-${photo.id}.jpg`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, photo.blob, {
      contentType: "image/jpeg",
      upsert: true,
      metadata: { capturedAt: photo.capturedAt } as Record<string, string>,
    });

  if (error) {
    await updatePhotoStatus(photo.id, "failed", photo.attempts + 1);
    throw error;
  }

  await deletePhoto(photo.id);
}

export async function processQueue(): Promise<{ succeeded: number; failed: number }> {
  const pending = await getPendingPhotos();
  let succeeded = 0;
  let failed = 0;

  for (const photo of pending) {
    try {
      await uploadOne(photo);
      succeeded++;
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}

async function registerBackgroundSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-expect-error SyncManager not in default lib.dom types
    await registration.sync.register(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

function startManualRetryFallback() {
  if (manualRetryTimer) return;
  manualRetryTimer = setInterval(async () => {
    await processCompressionQueue();
    const pending = await getPendingPhotos();
    if (pending.length === 0) {
      stopManualRetryFallback();
      return;
    }
    if (navigator.onLine) {
      await processQueue();
    }
  }, MANUAL_RETRY_INTERVAL_MS);
}

function stopManualRetryFallback() {
  if (manualRetryTimer) {
    clearInterval(manualRetryTimer);
    manualRetryTimer = null;
  }
}

// Background Sync (Chrome/Android) fires even if the app is closed. Devices/
// browsers without it (notably iOS Safari) fall back to: retry on 'online',
// plus a polling timer while anything is pending. Both paths are silent —
// no UI is ever told a sync is in flight or has failed.
function triggerSync() {
  registerBackgroundSync().then((registered) => {
    if (!registered && navigator.onLine) {
      processQueue();
    }
  });
  startManualRetryFallback();
}

export function initPhotoQueue() {
  if (typeof window === "undefined") return;

  // Written so the service worker can upload directly from IndexedDB even
  // with no window open — required for Background Sync to survive an app kill.
  setSyncConfig({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/wash-sw.js").catch(() => {});
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "WASH_FLUSH_PHOTO_QUEUE") {
        processQueue();
      }
    });
  }

  window.addEventListener("online", () => {
    processQueue();
  });

  // Resume any work left over from a previous session/app-kill: photos that
  // never finished compressing, and photos that compressed but never uploaded.
  processCompressionQueue();
  getPendingPhotos().then((pending) => {
    if (pending.length > 0) {
      startManualRetryFallback();
      if (navigator.onLine) processQueue();
    }
  });
}

export { getAllPhotos, getPendingPhotos } from "./db";
