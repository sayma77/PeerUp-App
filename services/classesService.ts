// services/classesService.ts
// Firestore data layer for Live Classrooms — a new feature with no legacy
// Mongoose schema to translate from, so this shape is designed fresh
// against what the frontend (classrooms/index.tsx, classrooms/[id].tsx)
// actually needs.

import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export type ClassStatus = "live" | "upcoming" | "completed";
export type ClassPlatform = "Google Meet" | "Zoom" | "MS Teams" | "Discord";

export interface LiveClass {
  id: string;
  title: string;
  topicTags: string[];
  mentorId: string;
  mentorName: string;
  scheduledAt: Date;
  maxCapacity: number;
  registeredCount: number;
  platform: ClassPlatform;
  conferenceLink: string;
  status: ClassStatus;
  slidesUrl: string;
  repoUrl: string;
}

export interface Question {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  upvotes: number;
}

function classFromDoc(id: string, data: any): LiveClass {
  return {
    id,
    title: data.title,
    topicTags: data.topicTags ?? [],
    mentorId: data.mentorId,
    mentorName: data.mentorName,
    scheduledAt: (data.scheduledAt as Timestamp)?.toDate?.() ?? new Date(),
    maxCapacity: data.maxCapacity ?? 0,
    registeredCount: data.registeredCount ?? 0,
    platform: data.platform,
    conferenceLink: data.conferenceLink ?? "",
    status: data.status,
    slidesUrl: data.slidesUrl ?? "",
    repoUrl: data.repoUrl ?? "",
  };
}

// Simple, human-readable label for a class's start time — a stand-in for
// the old mock's hand-written strings ("Live now", "Tomorrow, 7:00 PM").
// Not pixel-identical to those, but close enough and always correct.
export function formatStartTime(liveClass: LiveClass): string {
  if (liveClass.status === "live") return "Live now";
  return liveClass.scheduledAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── List all classes (client filters by status/topic, same pattern as
// the Skills library screen) ────────────────────────────────────────
export async function fetchClasses(): Promise<LiveClass[]> {
  const q = query(collection(db, "classes"), orderBy("scheduledAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => classFromDoc(d.id, d.data()));
}

// ── Single class by id (for the detail screen) ──────────────────────
export async function fetchClassById(classId: string): Promise<LiveClass | null> {
  const snap = await getDoc(doc(db, "classes", classId));
  if (!snap.exists()) return null;
  return classFromDoc(snap.id, snap.data());
}

// ── Create a class (mentor-only action, from CreateClassModal) ──────
export async function createClass(params: {
  title: string;
  topicTags: string[];
  mentorId: string;
  mentorName: string;
  scheduledAt: Date;
  maxCapacity: number;
  platform: ClassPlatform;
  conferenceLink: string;
}) {
  return addDoc(collection(db, "classes"), {
    title: params.title,
    topicTags: params.topicTags,
    mentorId: params.mentorId,
    mentorName: params.mentorName,
    scheduledAt: Timestamp.fromDate(params.scheduledAt),
    maxCapacity: params.maxCapacity,
    registeredCount: 0,
    platform: params.platform,
    conferenceLink: params.conferenceLink,
    status: "upcoming",
    slidesUrl: "",
    repoUrl: "",
    createdAt: serverTimestamp(),
  });
}

// ── Register for a class (idempotent — safe to call every time someone
// presses "Join Class") ──────────────────────────────────────────────
export async function registerForClass(
  classId: string,
  userId: string,
  userName: string
): Promise<void> {
  const registrantRef = doc(db, "classes", classId, "registrants", userId);
  const classRef = doc(db, "classes", classId);

  await runTransaction(db, async (tx) => {
    const registrantSnap = await tx.get(registrantRef);
    if (registrantSnap.exists()) return; // already registered, no-op

    const classSnap = await tx.get(classRef);
    if (!classSnap.exists()) throw new Error("Class not found");
    const classData = classSnap.data();

    if ((classData.registeredCount ?? 0) >= classData.maxCapacity) {
      throw new Error("This class is full");
    }

    tx.set(registrantRef, { userId, userName, registeredAt: serverTimestamp() });
    tx.update(classRef, { registeredCount: (classData.registeredCount ?? 0) + 1 });
  });
}

// ── Mentor marks a class completed, optionally attaching materials ──
export async function markClassCompleted(
  classId: string,
  materials: { slidesUrl: string; repoUrl: string }
) {
  await updateDoc(doc(db, "classes", classId), {
    status: "completed",
    slidesUrl: materials.slidesUrl,
    repoUrl: materials.repoUrl,
  });
}

// ── Discussion questions ─────────────────────────────────────────────
export async function fetchQuestions(classId: string): Promise<Question[]> {
  const q = query(
    collection(db, "classes", classId, "questions"),
    orderBy("upvotes", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      authorId: data.authorId,
      authorName: data.authorName,
      text: data.text,
      upvotes: data.upvotes ?? 0,
    };
  });
}

export async function submitQuestion(
  classId: string,
  params: { authorId: string; authorName: string; text: string }
) {
  await addDoc(collection(db, "classes", classId, "questions"), {
    ...params,
    upvotes: 0,
    upvotedBy: [],
    createdAt: serverTimestamp(),
  });
}

// One upvote per user, enforced via upvotedBy — the mock UI let anyone
// upvote a question repeatedly, this closes that gap.
export async function upvoteQuestion(classId: string, questionId: string, userId: string) {
  const questionRef = doc(db, "classes", classId, "questions", questionId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(questionRef);
    if (!snap.exists()) throw new Error("Question not found");
    const data = snap.data();
    const upvotedBy: string[] = data.upvotedBy ?? [];
    if (upvotedBy.includes(userId)) return; // already upvoted, no-op

    tx.update(questionRef, {
      upvotes: (data.upvotes ?? 0) + 1,
      upvotedBy: [...upvotedBy, userId],
    });
  });
}

// ── Post-class review ─────────────────────────────────────────────────
export async function submitClassReview(
  classId: string,
  params: { reviewerId: string; reviewerName: string; rating: number; comment: string }
) {
  await addDoc(collection(db, "classes", classId, "reviews"), {
    ...params,
    createdAt: serverTimestamp(),
  });
}
