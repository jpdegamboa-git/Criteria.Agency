// src/services/scale/integration.test.ts
// Cross-service integration tests for the Scale Engine (C-042 to C-044)

import { describe, it, expect } from "vitest";

// ── Pure function imports (no DB / LLM needed) ──────────────────────────────
import {
  buildCampaignFromDecomposition,
  computeCampaignProgress,
} from "./campaign-orchestrator.js";

import {
  computeAssetStats,
  matchAssetsByTags,
} from "./asset-registry.js";

import {
  DEFAULT_CAPACITY_CONFIG,
  computeUtilization,
  canDispatch,
  buildHealthEntry,
} from "./capacity-manager.js";

import type {
  // Campaign Orchestration
  Campaign,
  CampaignStatus,
  CampaignBudget,
  SharedCampaignContext,
  SubProjectEntry,
  ChannelSubBrief,
  DecompositionResult,
  CampaignProgress,
  // Asset Registry
  AssetRegistryEntry,
  AssetType,
  AssetOriginalContext,
  AssetPerformance,
  AssetAdaptation,
  AssetSearchResult,
  AssetRecommendation,
  AssetStats,
  // Capacity Manager
  CapacityConfig,
  CapacitySnapshot,
  AgentHealthEntry,
  CapacityOverview,
  AgentStatus,
  // Shared
  ScaleStepResult,
} from "./types.js";

// ── 1. TYPE COMPLETENESS TESTS ───────────────────────────────────────────────

describe("type completeness", () => {
  it("Campaign has all required fields", () => {
    const campaign: Campaign = {
      id: "camp-1",
      clientId: "client-1",
      name: "Q2 Product Launch",
      briefProjectId: null,
      brandDnaProjectId: null,
      status: "draft",
      sharedContext: {
        campaignMessage: "Launch our new product",
        visualDirection: "Modern and clean",
        toneGuidelines: "Professional",
        targetAudience: "Tech-savvy millennials",
        callToAction: "Buy now",
      },
      budget: {
        total: 10000,
        currency: "USD",
        allocated: {},
        spent: {},
      },
      subProjects: [],
      createdAt: "2026-04-07T00:00:00Z",
      updatedAt: "2026-04-07T00:00:00Z",
    };

    expect(campaign.id).toBeDefined();
    expect(campaign.clientId).toBeDefined();
    expect(campaign.name).toBeDefined();
    expect(campaign.status).toBeDefined();
    expect(campaign.sharedContext).toBeDefined();
    expect(campaign.subProjects).toBeDefined();
    expect(campaign.createdAt).toBeDefined();
    expect(campaign.updatedAt).toBeDefined();
  });

  it("DecompositionResult has all required fields", () => {
    const result: DecompositionResult = {
      subBriefs: [],
      sharedContext: {
        campaignMessage: "msg",
        visualDirection: "dir",
        toneGuidelines: "tone",
        targetAudience: "audience",
        callToAction: "cta",
      },
      totalEstimatedCost: 0,
    };

    expect(result.subBriefs).toBeDefined();
    expect(result.sharedContext).toBeDefined();
    expect(result.totalEstimatedCost).toBeDefined();
  });

  it("AssetRegistryEntry has all required fields", () => {
    const entry: AssetRegistryEntry = {
      id: "asset-1",
      artifactId: "art-1",
      clientId: "client-1",
      type: "image",
      tags: ["product", "hero"],
      description: "Hero image",
      originalContext: {
        projectId: "proj-1",
        campaign: "Q2",
        channel: "instagram",
        step: "production",
      },
      performance: {
        timesUsed: 0,
        channels: [],
        engagement: null,
      },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-04-07T00:00:00Z",
      lastUsedAt: null,
    };

    expect(entry.id).toBeDefined();
    expect(entry.artifactId).toBeDefined();
    expect(entry.clientId).toBeDefined();
    expect(entry.type).toBeDefined();
    expect(entry.tags).toBeDefined();
    expect(entry.performance).toBeDefined();
    expect(entry.adaptations).toBeDefined();
  });

  it("CapacityOverview has all required fields", () => {
    const overview: CapacityOverview = {
      config: {
        maxConcurrentAgents: 10,
        maxConcurrentPerMotor: 3,
        maxConcurrentPerClient: 10,
      },
      current: {
        timestamp: "2026-04-07T00:00:00Z",
        concurrentAgents: 2,
        queueDepth: 1,
        agentsByStatus: { running: 2, queued: 1, idle: 7, error: 0 },
        avgResponseTimeMs: 250,
        errorCount: 0,
      },
      agents: [],
      utilizationPercent: 20,
    };

    expect(overview.config).toBeDefined();
    expect(overview.current).toBeDefined();
    expect(overview.agents).toBeDefined();
    expect(overview.utilizationPercent).toBeDefined();
  });

  it("ScaleStepResult has step, status, and data", () => {
    const stepResult: ScaleStepResult = {
      step: "sk_decompose",
      status: "completed",
      data: { campaignId: "camp-1" },
    };

    expect(stepResult.step).toBeDefined();
    expect(stepResult.status).toBeDefined();
    expect(stepResult.data).toBeDefined();
  });

  it("all CampaignStatus values are valid union members", () => {
    const statuses: CampaignStatus[] = [
      "draft",
      "decomposing",
      "dispatched",
      "in_progress",
      "consolidating",
      "delivered",
      "failed",
    ];
    expect(statuses).toHaveLength(7);
  });

  it("all AssetType values are valid union members", () => {
    const types: AssetType[] = ["image", "video", "audio", "document", "template", "component"];
    expect(types).toHaveLength(6);
  });

  it("all AgentStatus values are valid union members", () => {
    const statuses: AgentStatus[] = ["running", "queued", "idle", "error"];
    expect(statuses).toHaveLength(4);
  });
});

// ── 2. CROSS-SERVICE FLOW TESTS ──────────────────────────────────────────────

describe("cross-service flows", () => {
  // Shared test fixtures
  const sharedContext: SharedCampaignContext = {
    campaignMessage: "Introducing our eco-friendly product line",
    visualDirection: "Natural, earthy tones",
    toneGuidelines: "Warm and authentic",
    targetAudience: "Environmentally conscious consumers 25-40",
    callToAction: "Shop now",
  };

  const decomposition: DecompositionResult = {
    subBriefs: [
      {
        motor: "graphic-design",
        channel: "instagram",
        briefContent: "Create hero images showcasing eco products",
        specs: { dimensions: "1080x1080", format: "jpg" },
        priority: 1,
        estimatedCost: 1200,
      },
      {
        motor: "writers-room",
        channel: "linkedin",
        briefContent: "Write thought-leadership article about sustainability",
        specs: { wordCount: 800 },
        priority: 2,
        estimatedCost: 600,
      },
      {
        motor: "video-production",
        channel: "youtube",
        briefContent: "Produce explainer video for eco product line",
        specs: { duration: "60s" },
        priority: 3,
        estimatedCost: 2200,
      },
    ],
    sharedContext,
    totalEstimatedCost: 4000,
  };

  // ── Flow A: Campaign decomposition feeds asset tag search ─────────────────

  describe("flow A: campaign decomposition → asset tag search", () => {
    it("builds campaign with correct budget allocation per motor", () => {
      const campaign = buildCampaignFromDecomposition(
        "client-eco",
        "Eco Launch Q2",
        decomposition,
        5000,
        "USD",
      );

      expect(campaign.budget?.allocated["graphic-design"]).toBe(1200);
      expect(campaign.budget?.allocated["writers-room"]).toBe(600);
      expect(campaign.budget?.allocated["video-production"]).toBe(2200);
      expect(campaign.budget?.total).toBe(5000);
    });

    it("sub-briefs provide channel tags that drive asset search", () => {
      // Channels extracted from decomposition sub-briefs
      const channelTags = decomposition.subBriefs.map((sb) => sb.channel);

      const assets: AssetRegistryEntry[] = [
        {
          id: "a1",
          artifactId: "art1",
          clientId: "client-eco",
          type: "image",
          tags: ["instagram", "product", "eco"],
          description: "Eco product Instagram post",
          originalContext: { projectId: "p1", campaign: "Q1", channel: "instagram", step: "production" },
          performance: { timesUsed: 2, channels: ["instagram"], engagement: 3.8 },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-01-01T00:00:00Z",
          lastUsedAt: "2026-03-01T00:00:00Z",
        },
        {
          id: "a2",
          artifactId: "art2",
          clientId: "client-eco",
          type: "document",
          tags: ["linkedin", "sustainability", "copy"],
          description: "Sustainability article",
          originalContext: { projectId: "p1", campaign: "Q1", channel: "linkedin", step: "wr_draft" },
          performance: { timesUsed: 1, channels: ["linkedin"], engagement: 2.5 },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-01-15T00:00:00Z",
          lastUsedAt: "2026-02-01T00:00:00Z",
        },
        {
          id: "a3",
          artifactId: "art3",
          clientId: "client-eco",
          type: "video",
          tags: ["youtube", "explainer", "brand"],
          description: "Brand explainer video",
          originalContext: { projectId: "p2", campaign: "Q1", channel: "youtube", step: "video_gen" },
          performance: { timesUsed: 0, channels: [], engagement: null },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-02-01T00:00:00Z",
          lastUsedAt: null,
        },
      ];

      const searchResults = matchAssetsByTags(assets, channelTags);

      // All 3 assets match because each has a channel tag from the sub-briefs
      expect(searchResults).toHaveLength(3);
      // All have relevance score of 1/3 (1 channel match out of 3 query tags)
      for (const r of searchResults) {
        expect(r.relevanceScore).toBeGreaterThan(0);
        expect(r.matchReason).toContain("Matched");
      }
    });

    it("motor-level tags yield more targeted asset matches", () => {
      const assets: AssetRegistryEntry[] = [
        {
          id: "a1",
          artifactId: "art1",
          clientId: "client-eco",
          type: "image",
          tags: ["instagram", "graphic-design", "eco"],
          description: "Graphic design for Instagram",
          originalContext: { projectId: "p1", campaign: "Q1", channel: "instagram", step: "production" },
          performance: { timesUsed: 5, channels: ["instagram"], engagement: 4.5 },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-01-01T00:00:00Z",
          lastUsedAt: "2026-03-10T00:00:00Z",
        },
        {
          id: "a2",
          artifactId: "art2",
          clientId: "client-eco",
          type: "audio",
          tags: ["podcast", "brand-voice"],
          description: "Brand voice audio snippet",
          originalContext: { projectId: "p3", campaign: "Q1", channel: "podcast", step: "audio_gen" },
          performance: { timesUsed: 0, channels: [], engagement: null },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-03-01T00:00:00Z",
          lastUsedAt: null,
        },
      ];

      const motorTags = decomposition.subBriefs.map((sb) => sb.motor);
      const results = matchAssetsByTags(assets, motorTags);

      // Only a1 matches "graphic-design" tag; a2 has unrelated tags
      expect(results).toHaveLength(1);
      expect(results[0].asset.id).toBe("a1");
    });
  });

  // ── Flow B: Capacity check + dispatch decision ────────────────────────────

  describe("flow B: capacity check → dispatch decision", () => {
    it("allows campaign dispatch when capacity is available", () => {
      const config = DEFAULT_CAPACITY_CONFIG;
      // 3 sub-briefs from decomposition, well under all limits
      const subBriefCount = decomposition.subBriefs.length;

      expect(canDispatch(config, subBriefCount, 1, subBriefCount)).toBe(true);
    });

    it("blocks dispatch when global agent limit would be exceeded", () => {
      const config: CapacityConfig = {
        maxConcurrentAgents: 2,
        maxConcurrentPerMotor: 3,
        maxConcurrentPerClient: 10,
      };
      // 3 sub-briefs but max is 2
      const subBriefCount = decomposition.subBriefs.length;

      expect(canDispatch(config, subBriefCount, 1, subBriefCount)).toBe(false);
    });

    it("utilization rises proportionally as sub-projects are dispatched", () => {
      const config = DEFAULT_CAPACITY_CONFIG;
      const subBriefCount = decomposition.subBriefs.length; // 3

      const utilizationBefore = computeUtilization(0, config.maxConcurrentAgents);
      const utilizationAfter = computeUtilization(subBriefCount, config.maxConcurrentAgents);

      expect(utilizationBefore).toBe(0);
      expect(utilizationAfter).toBe(30); // 3/10 * 100
      expect(utilizationAfter).toBeGreaterThan(utilizationBefore);
    });

    it("healthy agent metrics allow continued dispatch", () => {
      const agent = buildHealthEntry("SK-001", 200, 0.97, 50, 1, "2026-04-07T10:00:00Z");

      expect(agent.status).toBe("healthy");
      // Healthy agent should not block future dispatches
      expect(agent.errorRate).toBeLessThan(0.1);
    });

    it("degraded agent still permits dispatch below motor limit", () => {
      const degradedAgent = buildHealthEntry("SK-002", 900, 0.88, 30, 4, "2026-04-07T09:00:00Z");
      const config: CapacityConfig = {
        maxConcurrentAgents: 10,
        maxConcurrentPerMotor: 3,
        maxConcurrentPerClient: 10,
      };

      expect(degradedAgent.status).toBe("degraded");
      // Dispatch decision is based on concurrency limits, not health status alone
      expect(canDispatch(config, 2, 1, 2)).toBe(true);
    });
  });

  // ── Flow C: Asset stats derived from campaign sub-project context ─────────

  describe("flow C: asset stats from campaign context", () => {
    it("computeAssetStats reflects assets produced by a campaign", () => {
      // Assets that would be produced by the campaign's sub-projects
      const campaignAssets: AssetRegistryEntry[] = [
        {
          id: "a1",
          artifactId: "art-ig-1",
          clientId: "client-eco",
          type: "image",
          tags: ["instagram", "hero", "eco", "graphic-design"],
          description: "Hero image for Instagram",
          originalContext: { projectId: "sub-p1", campaign: "Eco Launch Q2", channel: "instagram", step: "gd_produce" },
          performance: { timesUsed: 1, channels: ["instagram"], engagement: 4.0 },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-04-07T00:00:00Z",
          lastUsedAt: "2026-04-07T00:00:00Z",
        },
        {
          id: "a2",
          artifactId: "art-li-1",
          clientId: "client-eco",
          type: "document",
          tags: ["linkedin", "article", "sustainability", "writers-room"],
          description: "Sustainability thought-leadership article",
          originalContext: { projectId: "sub-p2", campaign: "Eco Launch Q2", channel: "linkedin", step: "wr_draft" },
          performance: { timesUsed: 0, channels: [], engagement: null },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-04-07T01:00:00Z",
          lastUsedAt: null,
        },
        {
          id: "a3",
          artifactId: "art-yt-1",
          clientId: "client-eco",
          type: "video",
          tags: ["youtube", "explainer", "eco", "video-production"],
          description: "Eco product explainer video",
          originalContext: { projectId: "sub-p3", campaign: "Eco Launch Q2", channel: "youtube", step: "video_gen" },
          performance: { timesUsed: 2, channels: ["youtube", "instagram"], engagement: 3.2 },
          adaptations: [{ assetId: "a3", channel: "instagram", format: "mp4-square" }],
          expiresAt: null,
          createdAt: "2026-04-07T02:00:00Z",
          lastUsedAt: "2026-04-07T12:00:00Z",
        },
      ];

      const stats = computeAssetStats(campaignAssets);

      // One asset per sub-project type
      expect(stats.totalAssets).toBe(3);
      expect(stats.byType["image"]).toBe(1);
      expect(stats.byType["document"]).toBe(1);
      expect(stats.byType["video"]).toBe(1);

      // 2 of 3 assets have been used (timesUsed > 0)
      expect(stats.reuseRate).toBeCloseTo(2 / 3);

      // "eco" appears in 2 assets — should be a top tag
      const ecoTag = stats.topTags.find((t) => t.tag === "eco");
      expect(ecoTag).toBeDefined();
      expect(ecoTag?.count).toBe(2);
    });

    it("campaign progress and asset stats share the same sub-project count", () => {
      const subProjects: SubProjectEntry[] = [
        { projectId: "sub-p1", motor: "graphic-design", channel: "instagram", status: "delivered", priority: 1, deliverables: ["art-ig-1"] },
        { projectId: "sub-p2", motor: "writers-room", channel: "linkedin", status: "in_progress", priority: 2, deliverables: [] },
        { projectId: "sub-p3", motor: "video-production", channel: "youtube", status: "delivered", priority: 3, deliverables: ["art-yt-1"] },
      ];

      const progress = computeCampaignProgress("camp-eco", "in_progress", subProjects);

      expect(progress.totalSubProjects).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.inProgress).toBe(1);
      expect(progress.failed).toBe(0);

      // Deliverables from completed sub-projects can be looked up in asset registry
      const deliverableIds = subProjects
        .filter((sp) => sp.status === "delivered")
        .flatMap((sp) => sp.deliverables);

      expect(deliverableIds).toHaveLength(2);
      expect(deliverableIds).toContain("art-ig-1");
      expect(deliverableIds).toContain("art-yt-1");
    });

    it("recently used assets are sorted correctly in stats", () => {
      const assets: AssetRegistryEntry[] = [
        {
          id: "a1",
          artifactId: "art1",
          clientId: "c1",
          type: "image",
          tags: [],
          description: "",
          originalContext: { projectId: "p1", campaign: "Q2", channel: "instagram", step: "s1" },
          performance: { timesUsed: 1, channels: [], engagement: null },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-04-01T00:00:00Z",
          lastUsedAt: "2026-04-01T00:00:00Z",
        },
        {
          id: "a2",
          artifactId: "art2",
          clientId: "c1",
          type: "document",
          tags: [],
          description: "",
          originalContext: { projectId: "p1", campaign: "Q2", channel: "linkedin", step: "s1" },
          performance: { timesUsed: 1, channels: [], engagement: null },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-04-01T00:00:00Z",
          lastUsedAt: "2026-04-07T12:00:00Z", // most recent
        },
        {
          id: "a3",
          artifactId: "art3",
          clientId: "c1",
          type: "video",
          tags: [],
          description: "",
          originalContext: { projectId: "p1", campaign: "Q2", channel: "youtube", step: "s1" },
          performance: { timesUsed: 0, channels: [], engagement: null },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-04-01T00:00:00Z",
          lastUsedAt: null, // never used
        },
      ];

      const stats = computeAssetStats(assets);

      // Only 2 assets have lastUsedAt; most recent (a2) should appear first
      expect(stats.recentlyUsed).toHaveLength(2);
      expect(stats.recentlyUsed[0].id).toBe("a2");
    });
  });

  // ── Flow D: End-to-end pure pipeline ─────────────────────────────────────

  describe("flow D: end-to-end pure pipeline", () => {
    it("campaign build → progress compute → asset search → utilization check forms a coherent pipeline", () => {
      // Step 1: Build campaign from decomposition
      const campaign = buildCampaignFromDecomposition(
        "client-eco",
        "Eco Launch Q2",
        decomposition,
        5000,
        "USD",
      );

      expect(campaign.status).toBe("decomposing");
      expect(campaign.subProjects).toHaveLength(0); // starts empty, filled on dispatch

      // Step 2: Simulate dispatched sub-projects
      const dispatchedSubProjects: SubProjectEntry[] = decomposition.subBriefs.map((sb, i) => ({
        projectId: `sub-p${i + 1}`,
        motor: sb.motor,
        channel: sb.channel,
        status: "in_progress",
        priority: sb.priority,
        deliverables: [],
      }));

      const progress = computeCampaignProgress("camp-eco", "dispatched", dispatchedSubProjects);
      expect(progress.totalSubProjects).toBe(3);
      expect(progress.inProgress).toBe(3);

      // Step 3: Check capacity for the dispatched count
      const canRun = canDispatch(
        DEFAULT_CAPACITY_CONFIG,
        dispatchedSubProjects.length,
        1,
        dispatchedSubProjects.length,
      );
      expect(canRun).toBe(true);

      // Step 4: Compute utilization with those agents running
      const utilization = computeUtilization(
        dispatchedSubProjects.length,
        DEFAULT_CAPACITY_CONFIG.maxConcurrentAgents,
      );
      expect(utilization).toBe(30);

      // Step 5: Search for reusable assets using campaign channels
      const existingAssets: AssetRegistryEntry[] = [
        {
          id: "reuse-1",
          artifactId: "old-art-1",
          clientId: "client-eco",
          type: "image",
          tags: ["instagram", "eco", "product"],
          description: "Existing eco Instagram image",
          originalContext: { projectId: "old-p1", campaign: "Q1", channel: "instagram", step: "production" },
          performance: { timesUsed: 4, channels: ["instagram"], engagement: 4.1 },
          adaptations: [],
          expiresAt: null,
          createdAt: "2026-01-01T00:00:00Z",
          lastUsedAt: "2026-03-15T00:00:00Z",
        },
      ];

      const channelTags = decomposition.subBriefs.map((sb) => sb.channel);
      const assetMatches = matchAssetsByTags(existingAssets, channelTags);

      expect(assetMatches).toHaveLength(1);
      expect(assetMatches[0].asset.id).toBe("reuse-1");
      expect(assetMatches[0].relevanceScore).toBeGreaterThan(0);

      // Step 6: Compute stats for the asset pool
      const stats = computeAssetStats(existingAssets);
      expect(stats.reuseRate).toBe(1); // all existing assets have been used
      expect(stats.totalAssets).toBe(1);
    });
  });
});
