import { describe, it, expect } from "vitest";
import type { ListenerType, AutonomyLevel, AlertCondition } from "./engine-types";

describe("engine-types", () => {
  it("ListenerType values are valid strings", () => {
    const types: ListenerType[] = ["brand", "culture", "industry", "competitive", "opportunity"];
    expect(types).toHaveLength(5);
  });

  it("AutonomyLevel values are valid numbers", () => {
    const levels: AutonomyLevel[] = [1, 2, 3, 4, 5];
    expect(levels).toHaveLength(5);
    levels.forEach((l) => expect(l).toBeGreaterThanOrEqual(1));
    levels.forEach((l) => expect(l).toBeLessThanOrEqual(5));
  });

  it("AlertCondition structure is valid", () => {
    const condition: AlertCondition = { metric: "sentiment_score", operator: "<", value: 30 };
    expect(condition.metric).toBe("sentiment_score");
    expect(condition.operator).toBe("<");
    expect(condition.value).toBe(30);
  });
});
