import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { IncomingRequest, OutgoingRequest, RequestStatus } from "../types/dashboard";
import { createNotification } from "./notificationsService";

export async function fetchIncomingRequests(mentorId: string): Promise<IncomingRequest[]> {
  const q = query(collection(db, "requests"), where("mentorId", "==", mentorId));
  const snap = await getDocs(q);
  return Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as any;
      const requesterSnap = await getDoc(doc(db, "users", data.requesterId));
      return {
        id: d.id,
        skillName: data.skillName,
        requesterName: requesterSnap.exists() ? (requesterSnap.data() as any).name : "Unknown",
        status: data.status as RequestStatus,
      };
    }),
  );
}

export async function fetchOutgoingRequests(requesterId: string): Promise<OutgoingRequest[]> {
  const q = query(collection(db, "requests"), where("requesterId", "==", requesterId));
  const snap = await getDocs(q);
  return Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as any;
      const mentorSnap = await getDoc(doc(db, "users", data.mentorId));
      return {
        id: d.id,
        skillName: data.skillName,
        mentorId: data.mentorId,
        skillId: data.skillId,
        mentorName: mentorSnap.exists() ? (mentorSnap.data() as any).name : "Unknown",
        status: data.status as RequestStatus,
      };
    }),
  );
}

// Updates the request and notifies the person who sent it.
// NOTE: use whatever string your RequestStatus type uses for rejection
// ("rejected" or "declined") in the `messages` map below.
export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  const ref = doc(db, "requests", requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Request not found");
  const req = snap.data() as any;

  // Same status again (e.g. double tap) -> don't re-notify
  if (req.status === status) return;

  await updateDoc(ref, { status });

  const mentorSnap = await getDoc(doc(db, "users", req.mentorId));
  const mentorName = mentorSnap.exists() ? (mentorSnap.data() as any).name : "Your mentor";

  const messages: Record<string, { type: any; message: string }> = {
    accepted: {
      type: "request_accepted",
      message: `${mentorName} accepted your request to learn ${req.skillName}!`,
    },
    rejected: {
      type: "request_rejected",
      message: `${mentorName} declined your request for ${req.skillName}.`,
    },
    completed: {
      type: "badge_earned",
      message: `🏅 You earned the ${req.skillName} badge! ${mentorName} marked your session as completed.`,
    },
  };

  const n = messages[status as string];
  if (!n) return;

  await createNotification({
    userId: req.requesterId,
    type: n.type,
    message: n.message,
    link: status === "completed" ? "/(tabs)/profile" : "/(tabs)/dashboard",
  });
}