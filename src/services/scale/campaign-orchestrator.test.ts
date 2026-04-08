// src/services/scale/campaign-orchestrator.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock the DB and LLM dependencies so pure-function tests run without external services
vi.mock("../../db/index.js", () => ({ db: {}, schema: { campaigns: {} } }));
vi.mock("./brief-decomposer.js", () => ({
  decomposeBrief: vi.fn(),
}));

import {
  buildCampaignFromDecomposition,
  computeCampaignProgress,
} from "./campaign-orchestrator.js";
import type { DecompositionResult, SubProjectEntry } from "./types.js";

describe("campaign-orchestrator", () => {
  describe("buildCampaignFromDecomposition", () => {
    it("creates campaign object from decomposition result", () => {
      const decomposition: DecompositionResult = {
        subBriefs: [
          {
            motor: "graphic-design",
            channel: "instagram",
            briefContent: "Create posts",
            specs: {},
            priority: 1,
            estimatedCost: 1000,
          },
          {
            motor: "writers-room",
            channel: "linkedin",
            briefContent: "Write articles",
            specs: {},
            priority: 2,
            estimatedCost: 500,
          },
        ],
        sharedContext: {
          campaignMessage: "Launch product",
          visualDirection: "Modern",
          toneGuidelines: "Professional",
          targetAudience: "Millennials",
          callToAction: "Buy now",
        },
        totalEstimatedCost: 1500,
      };

      const campaign = buildCampaignFromDecomposition(
        "client-1",
        "Q2 Launch",
        decomposition,
        2000,
        "USD",
      );

      expect(campaign.clientId).toBe("client-1");
      expect(campaign.name).toBe("Q2 Launch");
      expect(campaign.status).toBe("decomposing");
      expect(campaign.sharedContext.campaignMessage).toBe("Launch product");
      expect(campaign.budget?.total).toBe(2000);
      expect(campaign.budget?.allocated).toHaveProperty("graphic-design");
      expect(campaign.budget?.allocated).toHaveProperty("writers-room");
    });
  });

  describe("computeCampaignProgress", () => {
    it("computes progress from sub-project statuses", () => {
      const subProjects: SubProjectEntry[] = [
        { projectId: "p1", motor: "graphic-design", channel: "instagram", status: "delivered", priority: 1, deliverables: ["a1"] },
        { projectId: "p2", motor: "writers-room", channel: "linkedin", status: "brief", priority: 2, deliverables: [] },
        { projectId: "p3", motor: "video-production", channel: "youtube", status: "delivered", priority: 3, deliverables: ["a2"] },
      ];

      const progress = computeCampaignProgress("camp-1", "in_progress", subProjects);
      expect(progress.totalSubProjects).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.inProgress).toBe(1);
      expect(progress.failed).toBe(0);
    });

    it("detects failed sub-projects", () => {
      const subProjects: SubProjectEntry[] = [
        { projectId: "p1", motor: "graphic-design", channel: "instagram", status: "delivered", priority: 1, deliverables: [] },
        { projectId: "p2", motor: "writers-room", channel: "linkedin", status: "paused", priority: 2, deliverables: [] },
      ];

      const progress = computeCampaignProgress("camp-1", "in_progress", subProjects);
      expect(progress.completed).toBe(1);
      expect(progress.failed).toBe(1);
    });
  });
});
