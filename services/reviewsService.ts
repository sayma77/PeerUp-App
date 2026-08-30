import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function submitSkillReview(params: {
  reviewerId: string;
  reviewerName: string;
  mentorId: string;
  skillId: string;
  skillName: string;
  rating: number;
  comment: string;
}) {
  await addDoc(collection(db, "reviews"), {
    ...params,
    createdAt: serverTimestamp(),
  });
}

export async function fetchReviewsForMentor(mentorId: string) {
  const q = query(collection(db, "reviews"), where("mentorId", "==", mentorId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      student: { name: data.reviewerName },
      skill: { name: data.skillName },
      rating: data.rating,
      comment: data.comment,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    };
  });
}