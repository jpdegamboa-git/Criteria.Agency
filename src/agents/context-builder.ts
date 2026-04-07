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

// ── Shared Directives ─────────────────────────────────────────

const SHARED_DIRECTIVES = [
  "agents/_shared/brand-voice.md",
  "agents/_shared/production-constraints.md",
];

// Directives loaded only for specific pipelines
const PIPELINE_DIRECTIVES: Record<string, string[]> = {
  strategist: ["agents/_shared/harvard-frameworks.md"],
  "graphic-design": ["agents/_shared/design-constraints.md"],
};

async function loadDirectives(paths: string[]): Promise<string[]> {
  const directives: string[] = [];
  for (const relativePath of paths) {
    const fullPath = path.resolve(
      path.dirname(config.agentsPath),
      relativePath,
    );
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      directives.push(content);
    } catch {
      // Directive not found — skip without breaking execution
    }
  }
  return directives;
}

async function loadSharedDirectives(): Promise<string[]> {
  return loadDirectives(SHARED_DIRECTIVES);
}

async function loadPipelineDirectives(pipelineType: string): Promise<string[]> {
  const paths = PIPELINE_DIRECTIVES[pipelineType];
  if (!paths) return [];
  return loadDirectives(paths);
}

// ── Context Builder ────────────────────────────────────────────

export async function buildAgentContext(
  agentId: string,
  projectId: string,
  step: string,
  modelId: string,
  pipelineType: string = "video-production",
  parentProjectId?: string | null,
): Promise<{
  systemPrompt: string;
  userPrompt: string;
  attachments: Attachment[];
}> {
  // 1. Load shared directives (brand voice, production constraints)
  const sharedDirectives = await loadSharedDirectives();

  // 1b. Load pipeline-specific directives (e.g., Harvard frameworks for strategist)
  const pipelineDirectives = await loadPipelineDirectives(pipelineType);

  // 2. Load skill file
  const agentEntry = AGENT_REGISTRY[agentId];
  let skillFileContent = "";
  if (agentEntry?.skillFile) {
    const skillPath = path.resolve(
      path.dirname(config.agentsPath),
      agentEntry.skillFile,
    );
    try {
      skillFileContent = await fs.readFile(skillPath, "utf-8");
    } catch {
      // Skill file not found — agent runs without custom system prompt
    }
  }

  // 3. Assemble system prompt: shared + pipeline directives + agent skill file
  const systemPrompt = [...sharedDirectives, ...pipelineDirectives, skillFileContent]
    .filter(Boolean)
    .join("\n\n---\n\n");

  // 4. Look up context map entry
  const contextKey = `${agentId}:${step}`;
  const contextEntry = AGENT_CONTEXT_MAP[contextKey];

  if (!contextEntry) {
    return {
      systemPrompt,
      userPrompt: `Execute step "${step}" for project ${projectId}.`,
      attachments: [],
    };
  }

  // 5. Get model info for supported inputs
  const model = getModel(modelId);
  const supportedInputs = model?.supportedInputs ?? ["text"];

  // 6. Query artifacts from DB
  const textSections: string[] = [];
  const attachments: Attachment[] = [];

  // 6a. Load parent project artifacts (e.g., Brand DNA from Brand Builder)
  if (parentProjectId) {
    const parentArtifacts = await db
      .select()
      .from(schema.artifacts)
      .where(eq(schema.artifacts.projectId, parentProjectId));

    for (const artifact of parentArtifacts) {
      const attType = getAttachmentType(artifact.storagePath);
      if (attType === "document" || attType === "json") {
        try {
          const content = await fs.readFile(artifact.storagePath, "utf-8");
          textSections.push(
            `## [Parent Project] ${artifact.step}: ${artifact.name}\n\n${content}`,
          );
        } catch {
          // Skip unreadable parent artifacts
        }
      }
    }
  }

  // 6b. Load current project artifacts
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

  // 7. Assemble user prompt
  const userPrompt = [contextEntry.taskInstruction, ...textSections].join(
    "\n\n",
  );

  return { systemPrompt, userPrompt, attachments };
}
