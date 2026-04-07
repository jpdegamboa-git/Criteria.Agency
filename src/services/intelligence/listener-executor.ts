import { randomUUID } from "crypto";
import { db, schema } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import type { ListenerType } from "@/shared/engine-types";
import type { ListenerStepResult } from "./types.js";
import { classifyListenerSteps } from "../continuous-agent-runner.js";

export interface CycleResult {
  cycleId: string;
  listenerType: ListenerType;
  status: "completed" | "failed";
  stepsCompleted: number;
  error?: string;
  artifacts: string[];
}

type StepFn = (input: unknown) => Promise<ListenerStepResult>;

export class ListenerExecutor {
  private listenerType: ListenerType;
  private clientId: string;
  private stepFns: Record<string, StepFn>;
  private cycleId: string;

  constructor(
    listenerType: ListenerType,
    clientId: string,
    stepFns: Record<string, StepFn>,
  ) {
    this.listenerType = listenerType;
    this.clientId = clientId;
    this.stepFns = stepFns;
    this.cycleId = randomUUID();
  }

  async runCycle(): Promise<CycleResult> {
    const steps = classifyListenerSteps(this.listenerType);
    let stepsCompleted = 0;
    let previousOutput: unknown = null;
    const artifacts: string[] = [];

    for (const step of steps) {
      const stepFn = this.stepFns[step];
      if (!stepFn) {
        return {
          cycleId: this.cycleId,
          listenerType: this.listenerType,
          status: "failed",
          stepsCompleted,
          error: `No handler for step: ${step}`,
          artifacts,
        };
      }

      // Record step start
      const [run] = await db
        .insert(schema.continuousAgentRuns)
        .values({
          clientId: this.clientId,
          agentId: `${this.listenerType}-${step}`,
          listenerType: this.listenerType,
          step,
          status: "running",
          inputData: previousOutput as any,
          cycleId: this.cycleId,
          startedAt: new Date(),
        })
        .returning();

      let result: ListenerStepResult;
      try {
        result = await stepFn(previousOutput);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await db
          .update(schema.continuousAgentRuns)
          .set({ status: "failed", error: errorMsg, completedAt: new Date() })
          .where(eq(schema.continuousAgentRuns.id, run.id));

        return {
          cycleId: this.cycleId,
          listenerType: this.listenerType,
          status: "failed",
          stepsCompleted,
          error: errorMsg,
          artifacts,
        };
      }

      if (result.status === "failed") {
        await db
          .update(schema.continuousAgentRuns)
          .set({ status: "failed", error: result.error, completedAt: new Date() })
          .where(eq(schema.continuousAgentRuns.id, run.id));

        return {
          cycleId: this.cycleId,
          listenerType: this.listenerType,
          status: "failed",
          stepsCompleted,
          error: result.error,
          artifacts,
        };
      }

      // Track artifacts produced in this step
      // Note: Intelligence runs store report content in outputData (not project-based artifacts)
      // since continuous agents don't belong to a project.
      const producedArtifacts: string[] = [];
      if (result.artifactContent) {
        producedArtifacts.push(`${this.listenerType}_${step}_report`);
        artifacts.push(`${this.listenerType}_${step}_report`);
      }

      await db
        .update(schema.continuousAgentRuns)
        .set({
          status: "completed",
          outputData: result.data as any,
          artifactsProduced: producedArtifacts,
          completedAt: new Date(),
        })
        .where(eq(schema.continuousAgentRuns.id, run.id));

      previousOutput = result.data;
      stepsCompleted++;
    }

    // Update data source config last run time
    await db
      .update(schema.dataSourceConfigs)
      .set({ lastRunAt: new Date() })
      .where(
        and(
          eq(schema.dataSourceConfigs.clientId, this.clientId),
          eq(schema.dataSourceConfigs.listenerType, this.listenerType),
        ),
      );

    return {
      cycleId: this.cycleId,
      listenerType: this.listenerType,
      status: "completed",
      stepsCompleted,
      artifacts,
    };
  }
}
