// src/services/scale/asset-registry.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock DB and LLM dependencies so pure-function tests run without external services
vi.mock("../../db/index.js", () => ({ db: {}, schema: { assetRegistry: {} } }));
vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("{}"),
}));

import {
  computeAssetStats,
  matchAssetsByTags,
  buildIndexingPrompt,
  parseIndexingResult,
} from "./asset-registry.js";
import type { AssetRegistryEntry } from "./types.js";

describe("asset-registry", () => {
  const sampleAssets: AssetRegistryEntry[] = [
    {
      id: "a1",
      artifactId: "art1",
      clientId: "c1",
      type: "image",
      tags: ["product", "instagram", "hero"],
      description: "Hero image for product launch",
      originalContext: { projectId: "p1", campaign: "Q1", channel: "instagram", step: "production" },
      performance: { timesUsed: 3, channels: ["instagram", "facebook"], engagement: 4.2 },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-01-01",
      lastUsedAt: "2026-03-15",
    },
    {
      id: "a2",
      artifactId: "art2",
      clientId: "c1",
      type: "document",
      tags: ["copy", "linkedin", "blog"],
      description: "LinkedIn article about product features",
      originalContext: { projectId: "p1", campaign: "Q1", channel: "linkedin", step: "wr_draft" },
      performance: { timesUsed: 1, channels: ["linkedin"], engagement: 2.1 },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-01-15",
      lastUsedAt: "2026-02-01",
    },
    {
      id: "a3",
      artifactId: "art3",
      clientId: "c1",
      type: "video",
      tags: ["product", "youtube", "explainer"],
      description: "Product explainer video",
      originalContext: { projectId: "p2", campaign: "Q2", channel: "youtube", step: "video_gen" },
      performance: { timesUsed: 0, channels: [], engagement: null },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-03-01",
      lastUsedAt: null,
    },
  ];

  describe("computeAssetStats", () => {
    it("computes stats from asset list", () => {
      const stats = computeAssetStats(sampleAssets);
      expect(stats.totalAssets).toBe(3);
      expect(stats.byType.image).toBe(1);
      expect(stats.byType.document).toBe(1);
      expect(stats.byType.video).toBe(1);
      expect(stats.reuseRate).toBeCloseTo(2 / 3); // 2 of 3 have timesUsed > 0
      expect(stats.topTags.length).toBeGreaterThan(0);
      expect(stats.topTags[0].tag).toBe("product"); // appears in 2 assets
    });
  });

  describe("matchAssetsByTags", () => {
    it("returns assets matching any of the query tags sorted by match count", () => {
      const results = matchAssetsByTags(sampleAssets, ["product", "instagram"]);
      expect(results.length).toBe(2); // a1 matches both, a3 matches "product"
      expect(results[0].asset.id).toBe("a1"); // 2 matches
      expect(results[1].asset.id).toBe("a3"); // 1 match
    });

    it("returns empty array when no tags match", () => {
      const results = matchAssetsByTags(sampleAssets, ["nonexistent"]);
      expect(results).toHaveLength(0);
    });
  });

  describe("buildIndexingPrompt", () => {
    it("includes artifact name and type", () => {
      const prompt = buildIndexingPrompt("hero-image.png", "image", "Product launch Instagram post");
      expect(prompt).toContain("hero-image.png");
      expect(prompt).toContain("image");
    });
  });

  describe("parseIndexingResult", () => {
    it("parses valid indexing response", () => {
      const json = JSON.stringify({
        tags: ["product", "hero", "launch"],
        description: "Hero image for product launch campaign",
      });
      const result = parseIndexingResult(json);
      expect(result.tags).toContain("product");
      expect(result.description).toContain("Hero image");
    });

    it("handles markdown-fenced JSON", () => {
      const fenced = "```json\n" + JSON.stringify({
        tags: ["logo"],
        description: "Company logo",
      }) + "\n```";
      const result = parseIndexingResult(fenced);
      expect(result.tags).toContain("logo");
    });
  });
});
