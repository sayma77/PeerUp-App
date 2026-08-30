// services/skillsService.ts
// Firestore data layer for the Skills feature.
// Adjust the `db` import path to wherever your firebaseConfig.js actually lives.

import {
  collection,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { SkillCard, MentorDetail } from "../types/skills";

// ── Fetch all skills (skills library list) ─────────────────────────────
// Mirrors: Skill.find().populate('mentor', 'name')
// mentorName is denormalized on the skill doc itself, so no populate needed.
export async function fetchSkills(): Promise<SkillCard[]> {
  const q = query(collection(db, "skills"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      category: data.category,
      description: data.description,
      mentorId: data.mentorId,
      mentorName: data.mentorName,
    };
  });
}

// ── Fetch the current user's own skills (Dashboard → My Skills tab) ────
// Mirrors: Skill.find({ mentor: userId })
export async function fetchMySkills(mentorId: string): Promise<SkillCard[]> {
  const q = query(
    collection(db, "skills"),
    where("mentorId", "==", mentorId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      category: data.category,
      description: data.description,
      mentorId: data.mentorId,
      mentorName: data.mentorName,
    };
  });
}

// ── Add a skill ──────────────────────────────────────────────────────
// Mirrors: POST /api/skills/add
export async function addSkill(params: {
  name: string;
  category: string;
  description: string;
  mentorId: string;
  mentorName: string;
}) {
  return addDoc(collection(db, "skills"), {
    ...params,
    createdAt: serverTimestamp(),
  });
}

// ── Edit a skill ─────────────────────────────────────────────────────
// Mirrors: PUT /api/skills/:id
// Ownership check (mentor.toString() !== req.session.user.id) moves to
// security rules — see notes below. Still worth a client-side guard too
// so the UI doesn't even show the edit option to non-owners.
export async function editSkill(
  skillId: string,
  updates: { name: string; category: string; description: string }
) {
  await updateDoc(doc(db, "skills", skillId), updates);
}

// ── Delete a skill ───────────────────────────────────────────────────
// Mirrors: DELETE /api/skills/:id
export async function deleteSkill(skillId: string) {
  await deleteDoc(doc(db, "skills", skillId));
}

// ── Mentor detail modal ──────────────────────────────────────────────
// Mirrors: GET /api/skills/:id/mentor
// Two reads instead of one populate: the mentor's user doc, then (if
// logged in) the most recent request between this user/mentor/skill.
export async function fetchMentorDetail(
  skill: SkillCard,
  currentUserId: string | null
): Promise<MentorDetail> {
  const mentorSnap = await getDoc(doc(db, "users", skill.mentorId));
  if (!mentorSnap.exists()) throw new Error("Mentor not found");
  const mentorData = mentorSnap.data();

  let requestStatus: MentorDetail["requestStatus"] = "none";

  if (currentUserId) {
    const reqQuery = query(
      collection(db, "requests"),
      where("requesterId", "==", currentUserId),
      where("mentorId", "==", skill.mentorId),
      where("skillId", "==", skill.id),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const reqSnap = await getDocs(reqQuery);
    if (!reqSnap.empty) {
      requestStatus = reqSnap.docs[0].data().status;
    }
  }

  return {
    id: skill.mentorId,
    name: mentorData.name,
    username: mentorData.username,
    intro: mentorData.intro ?? null,
    bio: mentorData.bio ?? null,
    rating: mentorData.rating ?? 0,
    reviewCount: mentorData.reviewCount ?? 0,
    requestStatus,
  };
}

// ── Send a skill request ─────────────────────────────────────────────
// Mirrors: POST /api/requests/add (the part reachable from the Skills screen)
// Includes the same guards the old route had: no self-requests, no
// duplicate pending requests. Also writes the notification doc, same
// as the old Notification.create() call.
export async function sendSkillRequest(params: {
  requesterId: string;
  requesterName: string;
  mentorId: string;
  skillId: string;
  skillName: string;
}) {
  const { requesterId, requesterName, mentorId, skillId, skillName } = params;

  if (requesterId === mentorId) {
    throw new Error("You can't request yourself");
  }

  const existingQuery = query(
    collection(db, "requests"),
    where("requesterId", "==", requesterId),
    where("mentorId", "==", mentorId),
    where("skillId", "==", skillId),
    where("status", "==", "pending")
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error("Request already sent");
  }

  await addDoc(collection(db, "requests"), {
    requesterId,
    mentorId,
    skillId,
    skillName,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(db, "notifications"), {
    userId: mentorId,
    message: `${requesterName} wants to learn ${skillName} from you!`,
    link: "/dashboard?tab=overview",
    read: false,
    createdAt: serverTimestamp(),
  });
}
