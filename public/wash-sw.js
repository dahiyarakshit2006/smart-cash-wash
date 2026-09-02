// Service worker for /wash. Scope: Background Sync for the offline photo
// queue. Reads/writes IndexedDB directly and uploads via fetch so retries
// work even with no app window open — postMessage-to-client alone can't do
// that, since a killed app has no client to message.
//
// Deliberately does NOT cache app shell/pages here — that's a separate
// PWA-installability concern (see PWA manifest task), kept out of this file
// so the offline-queue module stays testable in isolation.

const DB_NAME = "wash-photo-queue";
const DB_VERSION = 1;
const STORE = "photos";
const CONFIG_STORE = "config";
const STORAGE_BUCKET = "wash-photos";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getConfig(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, "readonly");
    const req = tx.objectStore(CONFIG_STORE).get("sync");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteRecord(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function markFailed(db, id, attempts) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.status = "failed";
        record.attempts = attempts;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
  const db = await openDb();
  const config = await getConfig(db);
  if (!config) return; // main thread hasn't initialized config yet

  const all = await getAll(db, STORE);
  const pending = all.filter((p) => p.status === "pending" || p.status === "failed");

  for (const photo of pending) {
    const objectPath = `${photo.washRecordId}/${photo.slot}-${photo.id}.jpg`;
    try {
      const res = await fetch(
        `${config.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`,
        {
          method: "POST",
          headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
          },
          body: photo.blob,
        }
      );
      if (!res.ok) throw new Error(`upload failed: ${res.status}`);
      await deleteRecord(db, photo.id);
    } catch {
      await markFailed(db, photo.id, (photo.attempts || 0) + 1);
    }
  }
  db.close();
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event) => {
  if (event.tag === "wash-photo-queue-sync") {
    event.waitUntil(flushQueue());
  }
});
