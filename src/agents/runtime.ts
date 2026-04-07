import fs from "fs/promises";
import path from "path";
import type { ArtifactStep, ArtifactType } from "../shared/types.js";
import type { AgentResult } from "./mock.js";
import { executeMockAgent } from "./mock.js";
import { buildAgentContext } from "./context-builder.js";
import { getDefaultModel } from "./model-defaults.js";
import { getProviderForModel } from "../providers/registry.js";
import { pollUntilComplete } from "./job-poller.js";
import { AGENT_OUTPUT_TYPES } from "./context-map.js";
import { createArtifact, getStoragePath } from "../storage/artifacts.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { logger } from "../shared/logger.js";
import type { ModelType } from "../providers/types.js";

// ── Output type → task type mapping ────────────────────────────

const TASK_TYPE_MAP: Record<string, string> = {
  text: "text_gen",
  image: "image_gen",
  video: "video_gen",
  audio: "audio_voice",
};

// ── Output type → artifact type mapping ────────────────────────

const OUTPUT_ARTIFACT_TYPE: Record<string, ArtifactType> = {
  text: "document",
  image: "image",
  video: "video",
  audio: "audio",
};

// ── Output type → file extension mapping ───────────────────────

const OUTPUT_EXTENSION: Record<string, string> = {
  text: ".md",
  image: ".png",
  video: ".mp4",
  audio: ".wav",
};

// ── Helper: resolve model for an agent ─────────────────────────

async function getModelForAgent(
  agentId: string,
  projectId: string,
  step: string,
  outputType: string,
): Promise<string> {
  const taskType = TASK_TYPE_MAP[outputType];

  // Check project-specific modelConfigs first
  if (taskType) {
    const configs = await db
      .select()
      .from(schema.modelConfigs)
      .where(eq(schema.modelConfigs.projectId, projectId));
    const config = configs.find((c) => c.taskType === taskType);
    if (config) return config.recommendedModel;
  }

  // Fall back to defaults
  return getDefaultModel(agentId, step);
}

// ── Real execution ─────────────────────────────────────────────

async function executeRealAgent(
  agentId: string,
  projectId: string,
  step: ArtifactStep,
): Promise<AgentResult> {
  // a. Determine output type
  const contextKey = `${agentId}:${step}`;
  const outputType: ModelType =
    AGENT_OUTPUT_TYPES[contextKey] ?? "text";

  // a2. Get project for pipelineType and parentProjectId
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));
  const pipelineType = project?.pipelineType ?? "video-production";
  const parentProjectId = project?.parentProjectId;

  // b. Get model
  const modelId = await getModelForAgent(agentId, projectId, step, outputType);

  // c. Get provider — if mock, fall back to executeMockAgent
  const provider = await getProviderForModel(modelId);
  if (provider.id.startsWith("mock-")) {
    return executeMockAgent(agentId, projectId, step);
  }

  // d. Record execution start
  const startedAt = new Date();
  const [execution] = await db
    .insert(schema.agentExecutions)
    .values({
      projectId,
      agentId,
      step,
      attempt: 1,
      status: "running",
      startedAt,
    })
    .returning();

  try {
    // e. Build context
    const { systemPrompt, userPrompt, attachments } = await buildAgentContext(
      agentId,
      projectId,
      step,
      modelId,
      pipelineType,
      parentProjectId,
    );

    // f. Call provider.generate
    let result = await provider.generate({
      model: modelId,
      systemPrompt,
      userPrompt,
      attachments,
      maxTokens: outputType === "text" ? 4096 : undefined,
    });

    // g. If processing (async job), poll until complete
    if (result.status === "processing" && result.jobId) {
      result = await pollUntilComplete(provider, result.jobId, outputType);
    }

    // h. If failed, throw
    if (result.status === "failed") {
      throw new Error(result.error ?? `Agent ${agentId} generation failed`);
    }

    // i. Save output as artifact(s)
    const artifactIds: string[] = [];
    const output = result.output;

    if (outputType === "text" && output?.text) {
      // Text output → save as .md document
      const artifact = await createArtifact({
        projectId,
        step,
        type: "document",
        name: `${agentId}_${step}.md`,
        content: output.text,
        agentId,
      });
      artifactIds.push(artifact.id);
    } else if (output?.fileUrl) {
      // File URL output → download and save
      const dir = await getStoragePath(projectId, step);
      const ext = OUTPUT_EXTENSION[outputType] ?? ".bin";
      const fileName = `${agentId}_${step}${ext}`;
      const filePath = path.join(dir, fileName);

      const response = await fetch(output.fileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download file from ${output.fileUrl}: ${response.status}`,
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      const artifactType = OUTPUT_ARTIFACT_TYPE[outputType] ?? "document";
      const [artifact] = await db
        .insert(schema.artifacts)
        .values({
          projectId,
          step,
          type: artifactType,
          name: fileName,
          version: 1,
          storagePath: filePath,
          createdByAgent: agentId,
          metadata: output.metadata ?? {},
        })
        .returning();
      artifactIds.push(artifact.id);
    } else if (output?.filePath) {
      // Local file path (e.g. base64-decoded image from Gemini Imagen)
      const dir = await getStoragePath(projectId, step);
      const ext = OUTPUT_EXTENSION[outputType] ?? ".bin";
      const fileName = `${agentId}_${step}${ext}`;
      const destPath = path.join(dir, fileName);

      // Copy from provider's temp location to project storage
      await fs.copyFile(output.filePath, destPath);

      const artifactType = OUTPUT_ARTIFACT_TYPE[outputType] ?? "document";
      const [artifact] = await db
        .insert(schema.artifacts)
        .values({
          projectId,
          step,
          type: artifactType,
          name: fileName,
          version: 1,
          storagePath: destPath,
          createdByAgent: agentId,
          metadata: output.metadata ?? {},
        })
        .returning();
      artifactIds.push(artifact.id);
    } else if (output?.text) {
      // Fallback: any text → save as .md
      const artifact = await createArtifact({
        projectId,
        step,
        type: "document",
        name: `${agentId}_${step}.md`,
        content: output.text,
        agentId,
      });
      artifactIds.push(artifact.id);
    }

    // j. Update agentExecutions with completed status
    await db
      .update(schema.agentExecutions)
      .set({
        status: "completed",
        completedAt: new Date(),
        outputArtifactIds: artifactIds,
        cost: result.cost ?? { tokens: 0, credits: 0 },
      })
      .where(eq(schema.agentExecutions.id, execution.id));

    logger.info("agent.executed", {
      agentId,
      projectId,
      step,
      modelId,
      outputType,
      artifactsCreated: artifactIds.length,
      mock: false,
    });

    // k. Return result
    return { agentId, step, artifactIds, success: true };
  } catch (error) {
    // On error: update agentExecutions with failed status, then re-throw
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await db
      .update(schema.agentExecutions)
      .set({
        status: "failed",
        completedAt: new Date(),
        error: errorMessage,
      })
      .where(eq(schema.agentExecutions.id, execution.id));

    logger.error("agent.failed", {
      agentId,
      projectId,
      step,
      modelId,
      error: errorMessage,
    });

    throw error;
  }
}

// ── Public entry point ─────────────────────────────────────────

export async function executeAgent(
  agentId: string,
  projectId: string,
  step: ArtifactStep,
): Promise<AgentResult> {
  try {
    return await executeRealAgent(agentId, projectId, step);
  } catch (error) {
    logger.warn("agent.fallbackToMock", {
      agentId,
      projectId,
      step,
      error: error instanceof Error ? error.message : String(error),
    });
    return executeMockAgent(agentId, projectId, step);
  }
}
