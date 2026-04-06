import fs from "fs/promises";
import path from "path";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { config } from "../shared/config.js";
import type { ArtifactStep, ArtifactType } from "../shared/types.js";

export async function getStoragePath(
  projectId: string,
  step: ArtifactStep
): Promise<string> {
  const dir = path.join(config.storagePath, "projects", projectId, step);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function createArtifact(opts: {
  projectId: string;
  step: ArtifactStep;
  type: ArtifactType;
  name: string;
  content: string;
  agentId: string;
  version?: number;
  metadata?: Record<string, unknown>;
}) {
  const dir = await getStoragePath(opts.projectId, opts.step);
  const filePath = path.join(dir, opts.name);
  await fs.writeFile(filePath, opts.content, "utf-8");

  const [artifact] = await db
    .insert(schema.artifacts)
    .values({
      projectId: opts.projectId,
      step: opts.step,
      type: opts.type,
      name: opts.name,
      version: opts.version ?? 1,
      storagePath: filePath,
      createdByAgent: opts.agentId,
      metadata: opts.metadata ?? {},
    })
    .returning();

  return artifact;
}

export async function getArtifacts(projectId: string, step?: ArtifactStep) {
  if (step) {
    return db
      .select()
      .from(schema.artifacts)
      .where(
        and(
          eq(schema.artifacts.projectId, projectId),
          eq(schema.artifacts.step, step)
        )
      );
  }
  return db
    .select()
    .from(schema.artifacts)
    .where(eq(schema.artifacts.projectId, projectId));
}

export async function readArtifact(artifactId: string): Promise<string | null> {
  const [artifact] = await db
    .select()
    .from(schema.artifacts)
    .where(eq(schema.artifacts.id, artifactId));

  if (!artifact) return null;

  try {
    return await fs.readFile(artifact.storagePath, "utf-8");
  } catch {
    return null;
  }
}
