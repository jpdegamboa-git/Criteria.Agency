import { describe, it, expect } from "vitest";
import { rebalanceSiblings } from "../components/portal/budget-equalizer";

describe("rebalanceSiblings", () => {
  it("redistributes unlocked siblings proportionally", () => {
    const nodes = [
      { id: "a", percentage: 40, locked: true },
      { id: "b", percentage: 30, locked: false },
      { id: "c", percentage: 30, locked: false },
    ];
    const result = rebalanceSiblings(nodes, "a", 50);
    expect(result.find((n) => n.id === "a")!.percentage).toBe(50);
    expect(result.find((n) => n.id === "b")!.percentage).toBe(25);
    expect(result.find((n) => n.id === "c")!.percentage).toBe(25);
  });

  it("respects locked siblings", () => {
    const nodes = [
      { id: "a", percentage: 40, locked: false },
      { id: "b", percentage: 30, locked: true },
      { id: "c", percentage: 30, locked: false },
    ];
    const result = rebalanceSiblings(nodes, "a", 60);
    expect(result.find((n) => n.id === "a")!.percentage).toBe(60);
    expect(result.find((n) => n.id === "b")!.percentage).toBe(30);
    expect(result.find((n) => n.id === "c")!.percentage).toBe(10);
  });

  it("sum always equals 100", () => {
    const nodes = [
      { id: "a", percentage: 25, locked: false },
      { id: "b", percentage: 25, locked: false },
      { id: "c", percentage: 25, locked: false },
      { id: "d", percentage: 25, locked: false },
    ];
    const result = rebalanceSiblings(nodes, "a", 70);
    const sum = result.reduce((acc, n) => acc + n.percentage, 0);
    expect(sum).toBe(100);
  });
});
