// services/projectsService.ts
// Firestore data layer for the Projects feature.
// Mirrors the pattern used in skillsService.ts.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {db} from "../firebaseConfig";
import {JoinRequest, Project, ProjectMember, ProjectStatus} from "../types/projects";

// ── Fetch all projects (Projects screen list) ───────────────────────────
export async function fetchProjects(): Promise<Project[]> {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

function toProject(id: string, data: any): Project {
  return {
    id,
    title: data.title,
    description: data.description,
    status: data.status,
    creator: data.creator,
    members: data.members ?? [],
    maxMembers: data.maxMembers,
    skillsRequired: data.skillsRequired ?? [],
    joinRequests: data.joinRequests ?? [],
  };
}

// ── Create a project ─────────────────────────────────────────────────
export async function createProject(params: {
  title: string;
  description: string;
  skillsRequired: string[];
  maxMembers: number;
  creator: ProjectMember;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "projects"), {
    title: params.title,
    description: params.description,
    status: "open" as ProjectStatus,
    creator: params.creator,
    members: [params.creator],
    maxMembers: params.maxMembers,
    skillsRequired: params.skillsRequired,
    joinRequests: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ── Edit a project's basic fields ────────────────────────────────────
export async function editProject(
  projectId: string,
  updates: {
    title: string;
    description: string;
    skillsRequired: string[];
    maxMembers: number;
  },
) {
  await updateDoc(doc(db, "projects", projectId), updates);
}

// ── Update status (Start / Complete) ─────────────────────────────────
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
) {
  await updateDoc(doc(db, "projects", projectId), {status});
}

// ── Delete a project ──────────────────────────────────────────────────
export async function deleteProject(projectId: string) {
  await deleteDoc(doc(db, "projects", projectId));
}

// ── Send a join request ───────────────────────────────────────────────
// Guards against self-joining and duplicate pending/accepted requests,
// same spirit as skillsService's sendSkillRequest guard checks.
export async function sendJoinRequest(
  projectId: string,
  requester: ProjectMember,
) {
  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error("Project not found");
  const project = toProject(snap.id, snap.data());

  if (project.creator.id === requester.id) {
    throw new Error("You can't request to join your own project");
  }
  if (project.members.some((m) => m.id === requester.id)) {
    throw new Error("You're already a member of this project");
  }
  const existing = project.joinRequests.find(
    (r) => r.userId === requester.id,
  );
  if (existing && existing.status !== "declined") {
    throw new Error("You've already requested to join this project");
  }

  const newRequest: JoinRequest = {
    userId: requester.id,
    username: requester.username,
    userName: requester.name,
    status: "pending",
  };

  // Replace any prior (declined) request from this user rather than
  // stacking duplicates, then add the fresh pending one.
  const nextJoinRequests = [
    ...project.joinRequests.filter((r) => r.userId !== requester.id),
    newRequest,
  ];

  await updateDoc(projectRef, {joinRequests: nextJoinRequests});

  await addDoc(collection(db, "notifications"), {
    userId: project.creator.id,
    message: `${requester.name} wants to join your project "${project.title}"`,
    link: "/dashboard?tab=project-requests",
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ── Accept a join request ─────────────────────────────────────────────
// Marks the request accepted AND adds the user to `members`.
export async function acceptJoinRequest(projectId: string, userId: string) {
  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error("Project not found");
  const project = toProject(snap.id, snap.data());

  const request = project.joinRequests.find((r) => r.userId === userId);
  if (!request) throw new Error("Join request not found");

  if (project.members.length >= project.maxMembers) {
    throw new Error("Project is already full");
  }

  const nextJoinRequests = project.joinRequests.map((r) =>
    r.userId === userId ? {...r, status: "accepted" as const} : r,
  );
  const alreadyMember = project.members.some((m) => m.id === userId);
  const nextMembers: ProjectMember[] = alreadyMember
    ? project.members
    : [
        ...project.members,
        {id: userId, name: request.userName, username: request.username},
      ];

  await updateDoc(projectRef, {
    joinRequests: nextJoinRequests,
    members: nextMembers,
  });
}

// ── Decline a join request ────────────────────────────────────────────
export async function declineJoinRequest(projectId: string, userId: string) {
  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error("Project not found");
  const project = toProject(snap.id, snap.data());

  const nextJoinRequests = project.joinRequests.map((r) =>
    r.userId === userId ? {...r, status: "declined" as const} : r,
  );

  await updateDoc(projectRef, {joinRequests: nextJoinRequests});
}