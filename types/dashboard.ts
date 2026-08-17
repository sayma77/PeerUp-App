export type RequestStatus = "pending" | "accepted" | "declined" | "completed";

export type IncomingRequest = {
  id: string;
  skillName: string;
  requesterName: string;
  status: RequestStatus;
};

export type OutgoingRequest = {
  id: string;
  skillName: string;
  mentorId: string;
  skillId: string;
  mentorName: string;
  status: RequestStatus;
};

export type MySkill = {
  id: string;
  name: string;
  category: string;
  description?: string;
};

export type JoinRequest = {
  userId: string;
  username: string;
  userName: string;
  status: RequestStatus;
};

export type MyProject = {
  id: string;
  title: string;
  joinRequests: JoinRequest[];
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
