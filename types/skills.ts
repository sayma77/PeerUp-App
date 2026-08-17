export type SkillCard = {
  id: string;
  name: string;
  category: string;
  description: string;
  mentorId: string;
  mentorName: string;
};

export type RequestStatus = "none" | "pending" | "accepted" | "completed";

export type MentorDetail = {
  id: string;
  name: string;
  username: string;
  intro?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  requestStatus: RequestStatus;
};

export const CATEGORIES = [
  "Technology",
  "Design",
  "Business",
  "Music",
  "Language",
  "Cooking",
  "Fitness",
  "Other",
];
