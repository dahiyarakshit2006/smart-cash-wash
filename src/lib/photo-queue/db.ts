// IndexedDB-backed store for queued wash photos. Isolated from the rest of
// the app — no dependency on React, Next.js routing, or Supabase client
// config, so it can be tested (and used from the service worker) standalone.

const DB_NAME = "wash-photo-queue";
const DB_VERSION = 1;
const STORE = "photos";
const CONFIG_STORE = "config";

export type QueuedPhotoStatus =
  | "pending_compression" // raw blob saved, compression not yet run — upload must wait for this
  | "pending"
  | "uploading"
  | "uploaded"
  | "failed";

export interface QueuedPhoto {
  id: string; // uuid, also used as the storage object key suffix
  washRecordId: string;
  slot: "before" | "after" | "damage";
  blob: Blob; // raw while pending_compression, compressed+EXIF-stripped JPEG once pending
  capturedAt: string; // ISO timestamp, the one piece of "EXIF" we deliberately keep
  status: QueuedPhotoStatus;
  attempts: number;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("status", "status");
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putPhoto(photo: QueuedPhoto): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(photo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function updatePhotoStatus(
  id: string,
  status: QueuedPhotoStatus,
  attempts?: number
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as QueuedPhoto | undefined;
      if (record) {
        record.status = status;
        if (attempts !== undefined) record.attempts = attempts;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// Swaps the raw blob for the compressed one once background compression
// finishes, and flips status pending_compression -> pending in one write.
export async function replacePhotoBlob(
  id: string,
  blob: Blob,
  capturedAt: string
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as QueuedPhoto | undefined;
      if (record) {
        record.blob = blob;
        record.capturedAt = capturedAt;
        record.status = "pending";
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAllPhotos(): Promise<QueuedPhoto[]> {
  const db = await openDb();
  const result = await new Promise<QueuedPhoto[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedPhoto[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function getPendingPhotos(): Promise<QueuedPhoto[]> {
  const all = await getAllPhotos();
  // pending_compression is deliberately excluded: those blobs are still raw
  // (~4MB) and must not be uploaded until background compression replaces them.
  return all.filter((p) => p.status === "pending" || p.status === "failed");
}

export async function getPhotosAwaitingCompression(): Promise<QueuedPhoto[]> {
  const all = await getAllPhotos();
  return all.filter((p) => p.status === "pending_compression");
}

// Config store lets the service worker (which can't read process.env)
// upload directly from IndexedDB even when no app window is open —
// required for Background Sync to actually work while the app is closed.
export async function setSyncConfig(config: { supabaseUrl: string; anonKey: string }): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, "readwrite");
    tx.objectStore(CONFIG_STORE).put({ key: "sync", ...config });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
