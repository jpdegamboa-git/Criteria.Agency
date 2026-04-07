import type { ListenerType } from "@/shared/engine-types";
import { db, schema } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import { ListenerExecutor, type CycleResult } from "./listener-executor.js";
import { BrandListener } from "./brand-listener.js";
import { CultureListener } from "./culture-listener.js";
import { IndustryListener } from "./industry-listener.js";
import { CompetitiveListener } from "./competitive-listener.js";
import { OpportunityAgent } from "./opportunity-agent.js";

export async function runListener(clientId: string, listenerType: ListenerType): Promise<CycleResult> {
  const [dsConfig] = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(
      and(
        eq(schema.dataSourceConfigs.clientId, clientId),
        eq(schema.dataSourceConfigs.listenerType, listenerType),
      ),
    );

  const config = (dsConfig?.config as Record<string, unknown>) ?? {};
  const baseConfig = { clientId, ...config };

  let stepFns: Record<string, (input: unknown) => Promise<import("./types.js").ListenerStepResult>>;

  switch (listenerType) {
    case "brand":
      stepFns = new BrandListener().buildStepFns(baseConfig as any);
      break;
    case "culture":
      stepFns = new CultureListener().buildStepFns(baseConfig as any);
      break;
    case "industry":
      stepFns = new IndustryListener().buildStepFns(baseConfig as any);
      break;
    case "competitive":
      stepFns = new CompetitiveListener().buildStepFns(baseConfig as any);
      break;
    case "opportunity":
      stepFns = new OpportunityAgent().buildStepFns(clientId);
      break;
    default:
      throw new Error(`Unknown listener type: ${listenerType}`);
  }

  const executor = new ListenerExecutor(listenerType, clientId, stepFns);
  return executor.runCycle();
}
