export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  intro?: string;
  bio?: string;
  pinnedBadges?: string[];
};

export type Skill = {
  id: string;
  name: string;
  category: string;
};

export type CompletedSession = {
  id: string;
  skill: Skill;
  mentor?: {name: string};
};

export type LearningSession = {
  id: string;
  skill: Skill;
};

export type Review = {
  id: string;
  student: {name: string};
  skill: {name: string};
  rating: number;
  comment: string;
  createdAt: string;
};
