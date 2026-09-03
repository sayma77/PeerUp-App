// Handles AI resource generation
//
// IMPORTANT:
// The Gemini API key must NEVER be placed in this file.
// The key stays server-side in the Cloudflare Worker.

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getAuth } from "firebase/auth";

export type AIResourceType =
  | "Guide"
  | "Cheat Sheet"
  | "Exercise Set"
  | "Quiz"
  | "Roadmap"
  | "Study Notes"
  | "Tutorial"
  | "Interview Questions"
  | "Practice Problems"
  | "Summary";

export type AIResourceDifficulty =
  | "Beginner"
  | "Medium"
  | "Hard";

export type GenerateAIResourceParams = {
  skill: string;
  topic: string;
  resourceType: AIResourceType;
  difficulty?: AIResourceDifficulty;
};

export type AIResourceData = {
  title: string;
  skill: string;
  topic: string;
  resourceType: AIResourceType;
  difficulty?: AIResourceDifficulty;
  content: string;
  isAIGenerated: true;
};

const AI_RESOURCE_PROXY_URL =
  "https://peerup-ai-resource-proxy.wafeeaanisha.workers.dev";

export async function generateAIResource(
  params: GenerateAIResourceParams,
): Promise<AIResourceData> {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in to generate a resource.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch(AI_RESOURCE_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      action: "generate",
      ...params,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));

    throw new Error(
      errBody.error || "Resource generation failed.",
    );
  }

  return response.json();
}

export type RefineAIResourceParams = {
  resource: AIResourceData;
  instruction: string;
};

export async function refineAIResource(
  params: RefineAIResourceParams,
): Promise<AIResourceData> {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in to refine a resource.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch(AI_RESOURCE_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      action: "refine",
      ...params,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));

    throw new Error(
      errBody.error || "Resource refinement failed.",
    );
  }

  return response.json();
}

export async function downloadAIResourceAsPDF(
  resource: AIResourceData,
): Promise<void> {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const contentHtml = escapeHtml(resource.content)
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>",
    )
    .replace(
      /`([^`]+)`/g,
      "<code>$1</code>",
    )
    .replace(/\n/g, "<br />");

  const html = `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #172033;
          }

          .header {
            border-bottom: 2px solid #FFB300;
            padding-bottom: 18px;
            margin-bottom: 24px;
          }

          .brand {
            font-size: 24px;
            font-weight: bold;
            color: #FFB300;
          }

          .ai-note {
            background: #fff7df;
            border: 1px solid #FFB300;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #765800;
          }

          h1 {
            font-size: 28px;
            margin-bottom: 12px;
          }

          .metadata {
            margin-bottom: 24px;
            color: #64748B;
            font-size: 13px;
          }

          .tag {
            display: inline-block;
            background: #fff7df;
            color: #8a6500;
            border: 1px solid #FFB300;
            padding: 5px 9px;
            border-radius: 6px;
            margin-right: 6px;
            margin-bottom: 6px;
          }

          .content {
            font-size: 15px;
            line-height: 1.7;
          }

          code {
            background: #f1f5f9;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: monospace;
          }

          strong {
            color: #b87900;
          }

          .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #ddd;
            color: #94a3b8;
            font-size: 11px;
          }
        </style>
      </head>

      <body>

        <div class="header">
          <div class="brand">PeerUp</div>
        </div>

        <div class="ai-note">
          ✨
          <strong>
            This resource was generated with AI by PeerUp.
          </strong>

          <br />

          Please review the content before relying on it for important decisions.
        </div>

        <h1>${escapeHtml(resource.title)}</h1>

        <div class="metadata">

          <span class="tag">
            ${escapeHtml(resource.skill)}
          </span>

          <span class="tag">
            ${escapeHtml(resource.resourceType)}
          </span>

          ${
            resource.difficulty
              ? `
                <span class="tag">
                  ${escapeHtml(resource.difficulty)}
                </span>
              `
              : ""
          }

          <br />
          <br />

          <strong>Topic:</strong>
          ${escapeHtml(resource.topic)}

        </div>

        <div class="content">
          ${contentHtml}
        </div>

        <div class="footer">
          Generated and downloaded from PeerUp.
        </div>

      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
  });

  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      "PDF was created, but sharing is not available on this device.",
    );
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Download AI Resource PDF",
    UTI: "com.adobe.pdf",
  });
}