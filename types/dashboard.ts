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



// Project + its JoinRequest type are defined once in types/projects.ts and

// reused here — the Dashboard's "Project Requests" tab and the Projects

// screen both read the same Firestore `projects` collection, just filtered

// differently (Dashboard shows only projects the current user created).

export type {Project, JoinRequest} from "./projects";



// ── Team-Fit (AI suggestion) types ──────────────────────────────────

export type FitBand = "Low" | "Medium" | "High";



export type FitStatus =

  | {state: "idle"}

  | {state: "loading"}

  | {state: "done"; score: number; band: FitBand}

  | {state: "error"; message: string};



export const CATEGORIES = [

  "Tech",

  "Creative",

  "Languages",

  "Business",

  "Lifestyle",

];