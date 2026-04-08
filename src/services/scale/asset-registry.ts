// src/services/scale/asset-registry.ts
import { db, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { generateText } from "@/providers/generate-text.js";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type {
  AssetRegistryEntry,
  AssetSearchResult,
  AssetRecommendation,
  AssetStats,
  AssetType,
  AssetOriginalContext,
  AssetPerformance,
  AssetAdaptation,
  ScaleStepResult,
} from "./types.js";

const INDEXING_MODEL = "gemini-2.5-flash";

export function computeAssetStats(assets: AssetRegistryEntry[]): AssetStats {
  const byType: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  let reusedCount = 0;

  for (const asset of assets) {
    byType[asset.type] = (byType[asset.type] ?? 0) + 1;
    if (asset.performance.timesUsed > 0) reusedCount++;
    for (const tag of asset.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  const recentlyUsed = assets
    .filter((a) => a.lastUsedAt)
    .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""))
    .slice(0, 5);

  return {
    totalAssets: assets.length,
    byType,
    reuseRate: assets.length > 0 ? reusedCount / assets.length : 0,
    topTags,
    recentlyUsed,
  };
}

export function matchAssetsByTags(
  assets: AssetRegistryEntry[],
  queryTags: string[],
): AssetSearchResult[] {
  const results: AssetSearchResult[] = [];

  for (const asset of assets) {
    const matchCount = queryTags.filter((t) =>
      asset.tags.some((at) => at.toLowerCase() === t.toLowerCase()),
    ).length;

    if (matchCount > 0) {
      results.push({
        asset,
        relevanceScore: matchCount / queryTags.length,
        matchReason: `Matched ${matchCount} of ${queryTags.length} tags`,
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function buildIndexingPrompt(
  artifactName: string,
  artifactType: string,
  contextDescription: string,
): string {
  return `You are an asset librarian. Index this creative asset for future reuse.

ASSET: ${artifactName}
TYPE: ${artifactType}
CONTEXT: ${contextDescription}

Generate tags and a description for this asset. Tags should be specific and useful for search.

Respond with ONLY valid JSON:
{
  "tags": ["tag1", "tag2", ...],
  "description": "<one-sentence description of the asset>"
}`;
}

export function parseIndexingResult(text: string): { tags: string[]; description: string } {
  const parsed = parseJsonSafe<{ tags: string[]; description: string }>(text, null as unknown as { tags: string[]; description: string });
  if (!parsed || !Array.isArray(parsed.tags)) {
    throw new Error("Failed to parse indexing result");
  }
  return { tags: parsed.tags, description: parsed.description ?? "" };
}

export async function indexArtifact(
  artifactId: string,
  clientId: string,
  artifactName: string,
  artifactType: AssetType,
  context: AssetOriginalContext,
): Promise<AssetRegistryEntry> {
  const prompt = buildIndexingPrompt(artifactName, artifactType, JSON.stringify(context));

  const text = await generateText(
    INDEXING_MODEL,
    "You are an asset librarian that indexes creative assets for reuse.",
    prompt,
  );

  const { tags, description } = parseIndexingResult(text);

  const [row] = await db
    .insert(schema.assetRegistry)
    .values({
      artifactId,
      clientId,
      type: artifactType,
      tags,
      description,
      originalContext: context,
      performance: { timesUsed: 0, channels: [], engagement: null },
      adaptations: [],
    })
    .returning();

  return {
    id: row.id,
    artifactId: row.artifactId,
    clientId: row.clientId,
    type: row.type as AssetType,
    tags: (row.tags ?? []) as string[],
    description: row.description ?? "",
    originalContext: row.originalContext as AssetOriginalContext,
    performance: row.performance as AssetPerformance,
    adaptations: (row.adaptations ?? []) as AssetAdaptation[],
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

export async function listAssets(clientId: string): Promise<AssetRegistryEntry[]> {
  const rows = await db
    .select()
    .from(schema.assetRegistry)
    .where(eq(schema.assetRegistry.clientId, clientId));

  return rows.map((row) => ({
    id: row.id,
    artifactId: row.artifactId,
    clientId: row.clientId,
    type: row.type as AssetType,
    tags: (row.tags ?? []) as string[],
    description: row.description ?? "",
    originalContext: row.originalContext as AssetOriginalContext,
    performance: row.performance as AssetPerformance,
    adaptations: (row.adaptations ?? []) as AssetAdaptation[],
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  }));
}

export async function searchAssets(
  clientId: string,
  tags: string[],
): Promise<AssetSearchResult[]> {
  const assets = await listAssets(clientId);
  return matchAssetsByTags(assets, tags);
}

export async function getAssetStats(clientId: string): Promise<AssetStats> {
  const assets = await listAssets(clientId);
  return computeAssetStats(assets);
}

export async function recordAssetUsage(
  assetId: string,
  channel: string,
): Promise<void> {
  const [row] = await db
    .select()
    .from(schema.assetRegistry)
    .where(eq(schema.assetRegistry.id, assetId));

  if (!row) return;

  const perf = row.performance as AssetPerformance;
  const updatedPerf: AssetPerformance = {
    timesUsed: perf.timesUsed + 1,
    channels: Array.from(new Set([...perf.channels, channel])),
    engagement: perf.engagement,
  };

  await db
    .update(schema.assetRegistry)
    .set({
      performance: updatedPerf,
      lastUsedAt: new Date(),
    })
    .where(eq(schema.assetRegistry.id, assetId));
}

export async function getAssetRecommendations(
  clientId: string,
  channel: string,
  tags: string[],
): Promise<AssetRecommendation[]> {
  const results = await searchAssets(clientId, [...tags, channel]);

  return results.slice(0, 5).map((r) => ({
    asset: r.asset,
    suggestedUse: `Reuse for ${channel}: ${r.matchReason}`,
    adaptationNeeded: !r.asset.performance.channels.includes(channel),
    adaptationDetails: !r.asset.performance.channels.includes(channel)
      ? `Adapt from ${r.asset.originalContext.channel} to ${channel}`
      : null,
  }));
}

export async function runAssetIndexing(clientId: string): Promise<ScaleStepResult> {
  try {
    const stats = await getAssetStats(clientId);
    return {
      step: "sk_asset_index",
      status: "completed",
      data: { stats },
    };
  } catch (error) {
    return {
      step: "sk_asset_index",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
