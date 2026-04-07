import { randomUUID } from "crypto";
import type { ListenerType } from "@/shared/engine-types";

const LISTENER_STEPS: Record<ListenerType, string[]> = {
  brand: ["collect", "analyze", "report", "alert_eval"],
  culture: ["collect", "analyze", "report", "alert_eval"],
  industry: ["collect", "analyze", "report", "alert_eval"],
  competitive: ["collect", "analyze", "report", "alert_eval"],
  opportunity: ["aggregate", "evaluate", "generate", "prioritize"],
};

const CRON_MIN_INTERVALS: Record<string, number> = {
  "hourly": 50 * 60 * 1000,
  "daily": 20 * 60 * 60 * 1000,
  "weekly": 5 * 24 * 60 * 60 * 1000,
};

export function classifyListenerSteps(listenerType: ListenerType): string[] {
  return LISTENER_STEPS[listenerType];
}

export function buildCycleId(): string {
  return randomUUID();
}

export function shouldRunListener(
  lastRunAt: string | null,
  schedule: string,
): boolean {
  if (!lastRunAt) return true;
  const elapsed = Date.now() - new Date(lastRunAt).getTime();
  return elapsed >= estimateMinInterval(schedule);
}

function estimateMinInterval(cron: string): number {
  const parts = cron.split(" ");
  if (parts.length !== 5) return CRON_MIN_INTERVALS["daily"];
  const [minute, hour, , , dow] = parts;
  if (minute.startsWith("*/")) return (parseInt(minute.slice(2)) - 1) * 60 * 1000;
  if (hour === "*") return CRON_MIN_INTERVALS["hourly"];
  if (dow !== "*" && dow !== "?") return CRON_MIN_INTERVALS["weekly"];
  return CRON_MIN_INTERVALS["daily"];
}
