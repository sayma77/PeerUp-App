export type ProjectStatus = "open" | "in-progress" | "completed";

export type ProjectMember = {
  id: string;
  name: string;
  username: string;
};

export type JoinRequestStatus = "pending" | "accepted" | "declined";

export type JoinRequest = {
  userId: string;
  status: JoinRequestStatus;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  creator: ProjectMember;
  members: ProjectMember[];
  maxMembers: number;
  skillsRequired: string[];
  joinRequests: JoinRequest[];
};

export const STATUS_FILTERS: { label: string; value: ProjectStatus | "all" | "full" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Full", value: "full" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
];

// TEMPORARY: replace with real Firebase Auth uid once auth is wired up
export const CURRENT_USER_ID = "u1";