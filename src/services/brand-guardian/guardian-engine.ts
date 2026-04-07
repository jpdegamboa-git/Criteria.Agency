import { db, schema } from "../../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { validateVerbal } from "./verbal-validator.js";
import { validateVisual } from "./visual-validator.js";
import type {
  BrandValidation,
  BrandDimensionResult,
  BrandGuardianConfig,
  BrandRule,
  ValidateContentInput,
} from "./types.js";
import { DEFAULT_DIMENSION_WEIGHTS } from "./types.js";

export function computeOverallScore(
  dimensions: BrandDimensionResult[],
  weights: Record<string, number>,
): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const dim of dimensions) {
    const w = weights[dim.name] ?? 10;
    weightedSum += dim.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export function determineVerdict(
  score: number,
  dimensions: BrandDimensionResult[],
  config: BrandGuardianConfig,
): "pass" | "needs_revision" | "fail" {
  if (config.strictMode) {
    const hasCritical = dimensions.some((d) =>
      d.issues.some((i) => i.severity === "critical"),
    );
    if (hasCritical) return "fail";
  }

  if (score >= config.passThreshold) return "pass";
  if (score < 60) return "fail";
  return "needs_revision";
}

async function loadBrandDna(clientId: string): Promise<string> {
  const [run] = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(
      and(
        eq(schema.continuousAgentRuns.clientId, clientId),
        eq(schema.continuousAgentRuns.listenerType, "brand"),
        eq(schema.continuousAgentRuns.step, "report"),
        eq(schema.continuousAgentRuns.status, "completed"),
      ),
    )
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(1);

  if (run?.outputData) {
    const data = run.outputData as Record<string, unknown>;
    if (typeof data.report === "string") return data.report;
  }

  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId));

  if (client?.brandAssets) {
    const assets = client.brandAssets as Record<string, unknown>;
    if (typeof assets.brandDna === "string") return assets.brandDna;
  }

  return "No Brand DNA available. Evaluate based on general best practices.";
}

async function loadRules(clientId: string): Promise<BrandRule[]> {
  const rows = await db
    .select()
    .from(schema.brandRules)
    .where(
      and(
        eq(schema.brandRules.clientId, clientId),
        eq(schema.brandRules.enabled, true),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    dimension: r.dimension,
    type: r.type as BrandRule["type"],
    rule: r.rule,
    source: r.source as BrandRule["source"],
    examples: (r.examples ?? []) as BrandRule["examples"],
    confidence: parseFloat(r.confidence ?? "1.00"),
    enabled: r.enabled,
  }));
}

async function loadConfig(clientId: string): Promise<BrandGuardianConfig> {
  const [row] = await db
    .select()
    .from(schema.brandGuardianConfigs)
    .where(eq(schema.brandGuardianConfigs.clientId, clientId));

  if (row) {
    return {
      clientId,
      passThreshold: row.passThreshold,
      autoPassThreshold: row.autoPassThreshold,
      strictMode: row.strictMode,
      weightsByDimension: (row.weightsByDimension ?? {}) as Record<string, number>,
    };
  }

  return {
    clientId,
    passThreshold: 80,
    autoPassThreshold: 95,
    strictMode: false,
    weightsByDimension: {},
  };
}

export async function validateContent(input: ValidateContentInput & { clientId: string }): Promise<BrandValidation> {
  const { clientId, content, contentType, projectId } = input;

  const [brandDna, rules, config] = await Promise.all([
    input.brandDna ? Promise.resolve(input.brandDna) : loadBrandDna(clientId),
    loadRules(clientId),
    loadConfig(clientId),
  ]);

  const [verbalDims, visualDims] = await Promise.all([
    validateVerbal({ content, brandDna, rules }),
    validateVisual({ content, brandDna, rules }),
  ]);

  const allDimensions = [...verbalDims, ...visualDims];
  const weights = { ...DEFAULT_DIMENSION_WEIGHTS, ...config.weightsByDimension };
  const overallScore = computeOverallScore(allDimensions, weights);
  const verdict = determineVerdict(overallScore, allDimensions, config);

  const allIssues = allDimensions.flatMap((d) => d.issues);
  const autoFixable = allIssues.length > 0 && allIssues.every((i) => i.severity === "minor");
  const autoFixSuggestions = autoFixable ? allIssues.map((i) => i.suggestion) : [];

  const summary = `Brand consistency score: ${overallScore}/100. Verdict: ${verdict}. ${allIssues.length} issue(s) found across ${allDimensions.filter((d) => d.issues.length > 0).length} dimension(s).`;

  const validation: BrandValidation = {
    overallScore,
    verdict,
    dimensions: allDimensions,
    summary,
    autoFixable,
    autoFixSuggestions,
  };

  await db.insert(schema.brandValidations).values({
    clientId,
    projectId: projectId ?? null,
    contentType,
    overallScore,
    verdict: verdict as any,
    dimensions: allDimensions as any,
    summary,
    autoFixable,
    autoFixSuggestions: autoFixSuggestions as any,
  });

  return validation;
}
