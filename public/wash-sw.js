// Service worker for /wash. Two jobs:
// 1. Background Sync for the offline photo queue (reads/writes IndexedDB
//    directly and uploads via fetch so retries work with no app window open).
// 2. A network-first app-shell cache so /wash pages still load when the
//    device has no signal at all (not just a bad connection) — required for
//    PWA installability and for the worker to be able to open the app cold.

const DB_NAME = "wash-photo-queue";
const DB_VERSION = 1;
const STORE = "photos";
const CONFIG_STORE = "config";
const STORAGE_BUCKET = "wash-photos";
const SHELL_CACHE = "wash-shell-v1";

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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !url.pathname.startsWith("/wash")) return;
  // Never cache Supabase/API calls or the dev-only queue-test harness.
  if (url.pathname.startsWith("/wash/dev-queue-test")) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(event.request);
        return cached ?? Response.error();
      }
    })()
  );
});
