import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { IncomingRequest, OutgoingRequest, RequestStatus } from "../types/dashboard";

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

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  await updateDoc(doc(db, "requests", requestId), { status });
}