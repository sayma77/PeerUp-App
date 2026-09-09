// services/skillPathService.ts
//
// Calls the shared AI Cloudflare Worker (see /cloudflare-worker/src/index.js),
// which holds the Gemini API key server-side. This is the SAME worker
// used by services/fitService.ts for Team-Fit Suggestions — both
// features are routed by the "action" field in the request body, so
// there's one deployment and one Gemini key for both. Nothing AI-related
// runs or is keyed on the client.

import { getAuth } from "firebase/auth";
import {
  SkillPathHistoryItem,
  SkillPathRecommendation,
} from "../types/skillPath";

// Shared with services/fitService.ts — same worker, same URL.
const AI_PROXY_URL = "https://peerup-fit-proxy.peerup-swe.workers.dev";

// Module-level in-flight promise tracker to deduplicate simultaneous calls (e.g. React StrictMode / fast double taps)
let activeRequestPromise: Promise<SkillPathRecommendation> | null = null;
let activeRequestKey = "";

export type RecommendSkillPathParams = {
  // Skills the user has finished learning (completed sessions).
  completedSkills: SkillPathHistoryItem[];
  // Skills the user is currently learning (accepted sessions).
  learningSkills: SkillPathHistoryItem[];
  // Skills the user already teaches/offers.
  offeredSkills: SkillPathHistoryItem[];
};

export async function recommendNextSkill(
  params: RecommendSkillPathParams,
): Promise<SkillPathRecommendation> {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in to get a skill recommendation.");
  }

  const totalHistory =
    params.completedSkills.length +
    params.learningSkills.length +
    params.offeredSkills.length;

  if (totalHistory === 0) {
    throw new Error(
      "Add a skill or finish a session first — we need a bit of history to recommend what's next.",
    );
  }

  // Create a fingerprint of the payload to identify duplicate concurrent executions
  const requestFingerprint = JSON.stringify({
    uid: user.uid,
    completed: params.completedSkills.map((s) => s.name || s.id).sort(),
    learning: params.learningSkills.map((s) => s.name || s.id).sort(),
    offered: params.offeredSkills.map((s) => s.name || s.id).sort(),
  });

  // If an identical request is already in-flight, return the existing promise
  if (activeRequestPromise && activeRequestKey === requestFingerprint) {
    return activeRequestPromise;
  }

  activeRequestKey = requestFingerprint;
  activeRequestPromise = executeRecommendationRequest(user, params).finally(() => {
    // Clear lock once finished
    activeRequestPromise = null;
    activeRequestKey = "";
  });

  return activeRequestPromise;
}

async function executeRecommendationRequest(
  user: any,
  params: RecommendSkillPathParams,
  attempt = 1,
): Promise<SkillPathRecommendation> {
  const idToken = await user.getIdToken();

  let response: Response;
  try {
    response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ action: "recommend-skill-path", ...params }),
    });
  } catch (networkErr: any) {
    // Retry once on network hiccups or timeouts
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return executeRecommendationRequest(user, params, attempt + 1);
    }

    console.error("Skill path network error:", networkErr);
    throw new Error(
      `Couldn't reach the AI worker (${networkErr?.message || "network error"}). Check AI_PROXY_URL and your connection.`,
    );
  }

  const rawText = await response.text();
  let body: any = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    console.error(
      `Skill path worker returned non-JSON (status ${response.status}):`,
      rawText.slice(0, 300),
    );
    throw new Error(
      `AI worker returned an unexpected response (status ${response.status}). ` +
        `Check that AI_PROXY_URL in skillPathService.ts matches your deployed worker, ` +
        `and check "npx wrangler tail" for server-side errors.`,
    );
  }

  // Handle transient 502 / 503 / 504 gateway errors with a single automatic backoff retry
  if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < 2) {
    console.warn(`Encountered upstream ${response.status} from Gemini. Retrying once...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return executeRecommendationRequest(user, params, attempt + 1);
  }

  if (!response.ok) {
    console.error(`Skill path worker error (status ${response.status}):`, body);
    throw new Error(
      body?.error
        ? `${body.error} (status ${response.status})`
        : `Couldn't generate a recommendation (status ${response.status}, no error detail returned).`,
    );
  }

  if (!body?.skill || !body?.explanation) {
    console.error("Skill path worker returned an unexpected shape:", body);
    throw new Error(
      "AI worker responded successfully but didn't return a valid recommendation.",
    );
  }

  return body as SkillPathRecommendation;
}