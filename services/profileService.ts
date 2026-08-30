import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { CompletedSession, LearningSession, ProfileUser } from "../types/profile";

export async function fetchProfileByUid(
  uid: string,
): Promise<ProfileUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return {id: snap.id, ...(snap.data() as Omit<ProfileUser, "id">)};
}

export async function fetchProfileByUsername(
  username: string,
): Promise<ProfileUser | null> {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return {id: d.id, ...(d.data() as Omit<ProfileUser, "id">)};
}

export async function updateProfile(
  uid: string,
  data: {name: string; intro: string; bio: string},
) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function updatePinnedBadges(uid: string, pinnedBadges: string[]) {
  await updateDoc(doc(db, "users", uid), {pinnedBadges});
}

export { fetchReviewsForMentor as fetchReviews } from "./reviewsService";
export { fetchMySkills as fetchOfferedSkills } from "./skillsService";

async function fetchRequestsByStatus(
  uid: string,
  status: "accepted" | "completed",
) {
  const q = query(
    collection(db, "requests"),
    where("requesterId", "==", uid),
    where("status", "==", status),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({id: d.id, ...(d.data() as any)}));
}

export async function fetchLearningSessions(
  uid: string,
): Promise<LearningSession[]> {
  const rows = await fetchRequestsByStatus(uid, "accepted");
  return Promise.all(
    rows.map(async (r) => {
      const skillSnap = await getDoc(doc(db, "skills", r.skillId));
      const skillData = skillSnap.data() as any;
      return {
        id: r.id,
        skill: {
          id: r.skillId,
          name: r.skillName ?? skillData?.name,
          category: skillData?.category,
        },
      };
    }),
  );
}

export async function fetchCompletedSessions(
  uid: string,
): Promise<CompletedSession[]> {
  const rows = await fetchRequestsByStatus(uid, "completed");
  return Promise.all(
    rows.map(async (r) => {
      const skillSnap = await getDoc(doc(db, "skills", r.skillId));
      const skillData = skillSnap.data() as any;
      const mentorSnap = await getDoc(doc(db, "users", r.mentorId));
      return {
        id: r.id,
        skill: {
          id: r.skillId,
          name: r.skillName ?? skillData?.name,
          category: skillData?.category,
        },
        mentor: mentorSnap.exists()
          ? {name: (mentorSnap.data() as any).name}
          : undefined,
      };
    }),
  );
}
