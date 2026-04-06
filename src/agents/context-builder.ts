import fs from "fs/promises";
import path from "path";
import { db, schema } from "../db/index.js";
import { eq, and, inArray } from "drizzle-orm";
import { config } from "../shared/config.js";
import { getModel } from "../providers/catalog.js";
import { AGENT_REGISTRY } from "./registry.js";
import { AGENT_CONTEXT_MAP } from "./context-map.js";
import type { Attachment } from "../providers/types.js";
import type { ArtifactStep } from "../shared/types.js";

// ── Extension → attachment type mapping ────────────────────────

const EXT_TYPE_MAP: Record<string, Attachment["type"]> = {
  ".md": "document",
  ".txt": "document",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
  ".mp3": "audio",
  ".wav": "audio",
  ".json": "json",
};

const EXT_MIME_MAP: Record<string, string> = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".json": "application/json",
};

function getAttachmentType(filePath: string): Attachment["type"] {
  const ext = path.extname(filePath).toLowerCase();
  return EXT_TYPE_MAP[ext] ?? "document";
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXT_MIME_MAP[ext] ?? "application/octet-stream";
}

// ── Context Builder ────────────────────────────────────────────

export async function buildAgentContext(
  agentId: string,
  projectId: string,
  step: string,
  modelId: string,
): Promise<{
  systemPrompt: string;
  userPrompt: string;
  attachments: Attachment[];
}> {
  // 1. Load skill file
  const agentEntry = AGENT_REGISTRY[agentId];
  let systemPrompt = "";
  if (agentEntry?.skillFile) {
    const skillPath = path.resolve(
      path.dirname(config.agentsPath),
      agentEntry.skillFile,
    );
    try {
      systemPrompt = await fs.readFile(skillPath, "utf-8");
    } catch {
      console.warn(
        `[CONTEXT] Could not load skill file for ${agentId}: ${skillPath}`,
      );
    }
  }

  // 2. Look up context map entry
  const contextKey = `${agentId}:${step}`;
  const contextEntry = AGENT_CONTEXT_MAP[contextKey];

  if (!contextEntry) {
    return {
      systemPrompt,
      userPrompt: `Execute step "${step}" for project ${projectId}.`,
      attachments: [],
    };
  }

  // 3. Get model info for supported inputs
  const model = getModel(modelId);
  const supportedInputs = model?.supportedInputs ?? ["text"];

  // 4. Query artifacts from DB
  const textSections: string[] = [];
  const attachments: Attachment[] = [];

  if (contextEntry.artifactSteps.length > 0) {
    const artifacts = await db
      .select()
      .from(schema.artifacts)
      .where(
        and(
          eq(schema.artifacts.projectId, projectId),
          inArray(
            schema.artifacts.step,
            contextEntry.artifactSteps as [ArtifactStep, ...ArtifactStep[]],
          ),
        ),
      );

    for (const artifact of artifacts) {
      const attType = getAttachmentType(artifact.storagePath);
      const mimeType = getMimeType(artifact.storagePath);

      if (attType === "document" || attType === "json") {
        // Text-based artifacts: always read content into prompt
        try {
          const content = await fs.readFile(artifact.storagePath, "utf-8");
          textSections.push(
            `## ${artifact.step}: ${artifact.name}\n\n${content}`,
          );
        } catch {
          textSections.push(
            `## ${artifact.step}: ${artifact.name}\n\n[Could not read file]`,
          );
        }

        // JSON files: also add as attachment if provider supports json input
        if (
          attType === "json" &&
          contextEntry.attachmentTypes.includes("json") &&
          supportedInputs.includes("json")
        ) {
          attachments.push({
            type: "json",
            name: artifact.name,
            mimeType,
            filePath: artifact.storagePath,
            artifactId: artifact.id,
          });
        }
      } else if (contextEntry.attachmentTypes.includes(attType)) {
        // File-based artifacts (image, video, audio)
        if (supportedInputs.includes(attType)) {
          attachments.push({
            type: attType,
            name: artifact.name,
            mimeType,
            filePath: artifact.storagePath,
            artifactId: artifact.id,
          });
        } else {
          textSections.push(
            `[Attachment: ${artifact.name} (${attType}, not supported by current model)]`,
          );
        }
      }
    }
  }

  // 5. Assemble user prompt
  const userPrompt = [contextEntry.taskInstruction, ...textSections].join(
    "\n\n",
  );

  return { systemPrompt, userPrompt, attachments };
}
