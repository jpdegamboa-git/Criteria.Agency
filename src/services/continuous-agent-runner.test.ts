import { describe, it, expect } from "vitest";
import { classifyListenerSteps, buildCycleId, shouldRunListener } from "./continuous-agent-runner";

describe("ContinuousAgentRunner", () => {
  describe("classifyListenerSteps", () => {
    it("returns correct steps for brand listener", () => {
      expect(classifyListenerSteps("brand")).toEqual(["collect", "analyze", "report", "alert_eval"]);
    });
    it("returns correct steps for opportunity agent", () => {
      expect(classifyListenerSteps("opportunity")).toEqual(["aggregate", "evaluate", "generate", "prioritize"]);
    });
    it("returns 4 steps for all listener types", () => {
      const types = ["brand", "culture", "industry", "competitive", "opportunity"] as const;
      types.forEach((type) => expect(classifyListenerSteps(type)).toHaveLength(4));
    });
  });

  describe("buildCycleId", () => {
    it("returns a valid UUID string", () => {
      expect(buildCycleId()).toMatch(/^[0-9a-f-]{36}$/);
    });
    it("returns unique IDs", () => {
      expect(buildCycleId()).not.toBe(buildCycleId());
    });
  });

  describe("shouldRunListener", () => {
    it("returns true when lastRunAt is null", () => {
      expect(shouldRunListener(null, "0 6 * * *")).toBe(true);
    });
    it("returns false when last run was recent", () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(shouldRunListener(tenMinAgo, "0 * * * *")).toBe(false);
    });
    it("returns true when last run was long ago", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldRunListener(twoDaysAgo, "0 6 * * *")).toBe(true);
    });
  });
});
