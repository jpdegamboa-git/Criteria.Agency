import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListenerExecutor } from "./listener-executor.js";
import type { ListenerStepResult } from "./types.js";
import type { ListenerType } from "@/shared/engine-types";

// Mock DB operations
vi.mock("@/db/index.js", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "run-1" }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "run-1" }]),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  schema: {
    continuousAgentRuns: {},
    alertRules: {},
    alerts: {},
    dataSourceConfigs: {},
  },
}));

describe("ListenerExecutor", () => {
  const mockSteps: Record<string, (input: unknown) => Promise<ListenerStepResult>> = {
    collect: vi.fn().mockResolvedValue({ step: "collect", status: "completed", data: [{ text: "mention" }] }),
    analyze: vi.fn().mockResolvedValue({ step: "analyze", status: "completed", data: { sentiment: 75 } }),
    report: vi.fn().mockResolvedValue({ step: "report", status: "completed", data: {}, artifactContent: "# Report" }),
    alert_eval: vi.fn().mockResolvedValue({ step: "alert_eval", status: "completed", data: { alertsFired: 0 } }),
  };

  let executor: ListenerExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new ListenerExecutor("brand" as ListenerType, "client-1", mockSteps);
  });

  it("executes all steps in sequence", async () => {
    const result = await executor.runCycle();
    expect(result.status).toBe("completed");
    expect(result.stepsCompleted).toBe(4);
    expect(mockSteps.collect).toHaveBeenCalledTimes(1);
    expect(mockSteps.analyze).toHaveBeenCalledTimes(1);
    expect(mockSteps.report).toHaveBeenCalledTimes(1);
    expect(mockSteps.alert_eval).toHaveBeenCalledTimes(1);
  });

  it("passes output of each step as input to next step", async () => {
    await executor.runCycle();
    expect(mockSteps.analyze).toHaveBeenCalledWith([{ text: "mention" }]);
    expect(mockSteps.report).toHaveBeenCalledWith({ sentiment: 75 });
  });

  it("stops on first failed step", async () => {
    (mockSteps.analyze as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      step: "analyze",
      status: "failed",
      data: null,
      error: "LLM error",
    });
    const result = await executor.runCycle();
    expect(result.status).toBe("failed");
    expect(result.stepsCompleted).toBe(1);
    expect(result.error).toBe("LLM error");
    expect(mockSteps.report).not.toHaveBeenCalled();
  });

  it("returns cycle ID for tracking", async () => {
    const result = await executor.runCycle();
    expect(result.cycleId).toBeDefined();
    expect(typeof result.cycleId).toBe("string");
  });

  it("handles step throwing an exception", async () => {
    (mockSteps.collect as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network timeout"));
    const result = await executor.runCycle();
    expect(result.status).toBe("failed");
    expect(result.error).toContain("Network timeout");
    expect(result.stepsCompleted).toBe(0);
  });
});
