// services/fitService.ts
//
// Calls the fit-analysis Cloudflare Worker, which holds the Gemini API
// key server-side (see /cloudflare-worker/src/index.js). Nothing
// AI-related runs or is keyed on the client.
//
// After deploying the Worker (`npx wrangler deploy` from the
// cloudflare-worker/ folder), paste the printed URL below.

import {getAuth} from "firebase/auth";
import {FitBand} from "../types/dashboard";

export type FitResult = {
  score: number; // 0-100
  band: FitBand;
};

export type AnalyzeFitParams = {
  projectTitle: string;
  projectDescription?: string;
  requiredSkills: string[];
  requesterName: string;
  requesterSkills: string[];
};

// TODO: replace with your deployed Worker URL, e.g.
// "https://peerup-fit-proxy.yoursubdomain.workers.dev"
const FIT_PROXY_URL = "https://peerup-fit-proxy.peerup-swe.workers.dev";

export async function analyzeProjectFit(
  params: AnalyzeFitParams,
): Promise<FitResult> {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("You must be signed in to analyze fit.");
  }
  const idToken = await user.getIdToken();

  const response = await fetch(FIT_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || "Fit analysis failed.");
  }

  return response.json();
}