// types/skillPath.ts
// Shared types for the AI Skill Path Recommender feature.

export type SkillPathHistoryItem = {
  name: string;
  category: string;
};

export type SkillPathAlternative = {
  skill: string;
  category: string;
};

export type SkillPathConfidence = "low" | "medium" | "high";

export type SkillPathRecommendation = {
  skill: string;
  category: string;
  // Short natural-language reason, e.g.
  // "Since you know Web Development and UI/UX, try React next."
  explanation: string;
  confidence: SkillPathConfidence;
  alternatives: SkillPathAlternative[];
};
