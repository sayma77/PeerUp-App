// services/notificationsService.ts
// Single place that reads/writes the top-level "notifications" collection.
// Shape: { userId, message, link, type, read, createdAt }

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Unsubscribe,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export type NotificationType =
  | "skill_request"
  | "request_accepted"
  | "request_rejected"
  | "request_completed"
  | "badge_earned"
  | "class_live";

export type AppNotification = {
  id: string;
  message: string;
  link: string;
  read: boolean;
  createdAtMs: number;
};

// ── Create one notification ──────────────────────────────────────────
export async function createNotification(params: {
  userId: string;
  message: string;
  link: string;
  type?: NotificationType;
}) {
  await addDoc(collection(db, "notifications"), {
    userId: params.userId,
    message: params.message,
    link: params.link,
    type: params.type ?? null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ── Notify every registered student when a class goes live ───────────
export async function notifyClassRegistrants(params: {
  classId: string;
  classTitle: string;
  mentorName: string;
}) {
  const regSnap = await getDocs(
    collection(db, "classes", params.classId, "registrants"),
  );
  if (regSnap.empty) return;

  const batch = writeBatch(db);
  regSnap.docs.forEach((r) => {
    batch.set(doc(collection(db, "notifications")), {
      userId: r.id, // registrant doc id === userId (see registerForClass)
      message: `🔴 "${params.classTitle}" with ${params.mentorName} is live now — join!`,
      link: `/(tabs)/classrooms/${params.classId}`,
      type: "class_live",
      read: false,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit(); // max 500 writes per batch
}

// ── Live subscription for the header bell ────────────────────────────
// No orderBy, so no composite index is needed; we sort on the client.
export function subscribeToNotifications(
  userId: string,
  cb: (items: AppNotification[]) => void,
): Unsubscribe {
  const q = query(collection(db, "notifications"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const items: AppNotification[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          message: data.message ?? "",
          link: data.link ?? "/",
          read: !!data.read,
          createdAtMs: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      cb(items);
    },
    (err) => console.warn("Notifications listener error:", err),
  );
}

// ── Mark notifications read ──────────────────────────────────────────
export async function markAllNotificationsRead(items: AppNotification[]) {
  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) =>
    batch.update(doc(db, "notifications", n.id), { read: true }),
  );
  await batch.commit();
}