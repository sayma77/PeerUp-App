export type ResourceLevel = "Beginner" | "Medium" | "Hard";

export type Resource = {
  id: string;
  title: string;
  description: string;
  link: string;
  skillName: string;
  level: ResourceLevel;
  addedBy: { id: string; name: string };
};

// TODO: replace with a real Firestore query on the `skills` collection
export const SKILL_OPTIONS = [
  "React Native",
  "Firebase",
  "UI Design",
  "Node.js",
  "MongoDB",
  "EJS",
  "Express",
];

export const LEVEL_OPTIONS: ResourceLevel[] = ["Beginner", "Medium", "Hard"];

// TEMPORARY: replace with real Firebase Auth uid once auth is wired up
export const CURRENT_USER_ID = "u1";