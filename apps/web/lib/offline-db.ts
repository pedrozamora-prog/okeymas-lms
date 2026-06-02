"use client";

import { openDB, type IDBPDatabase } from "idb";

interface ProgressQueueItem {
  id:        string;
  lessonId:  string;
  courseId:  string;
  timestamp: number;
  type:      "complete";
}

interface OfflineDB {
  "progress-queue": {
    key:   string;
    value: ProgressQueueItem;
    indexes: { by_lesson: string };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>("fitacademy-offline", 1, {
      upgrade(db) {
        const store = db.createObjectStore("progress-queue", { keyPath: "id" });
        store.createIndex("by_lesson", "lessonId");
      },
    });
  }
  return dbPromise;
}

export async function queueProgress(item: Omit<ProgressQueueItem, "id" | "timestamp">) {
  const db = await getDB();
  await db.put("progress-queue", {
    ...item,
    id:        `${item.lessonId}-${Date.now()}`,
    timestamp: Date.now(),
  });
}

export async function flushProgressQueue(): Promise<{ flushed: number; failed: number }> {
  const db    = await getDB();
  const items = await db.getAll("progress-queue");
  let flushed = 0, failed = 0;

  for (const item of items) {
    try {
      const res = await fetch(`/api/lessons/${item.lessonId}/complete`, { method: "POST" });
      if (res.ok) {
        await db.delete("progress-queue", item.id);
        flushed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { flushed, failed };
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count("progress-queue");
}
