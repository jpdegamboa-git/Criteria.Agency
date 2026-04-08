import { cn } from "@/lib/utils";
import type { CampaignState } from "@/lib/portal-types";

const stateStyles: Record<CampaignState, string> = {
  plan: "bg-state-plan-bg text-state-plan-text",
  ejecutar: "bg-state-exec-bg text-state-exec-text",
  seguimiento: "bg-state-track-bg text-state-track-text",
};

const stateLabels: Record<CampaignState, string> = {
  plan: "Plan",
  ejecutar: "Ejecutar",
  seguimiento: "Seguimiento",
};

export function StateBadge({ state }: { state: CampaignState }) {
  return (
    <span className={cn("inline-block text-[7px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded", stateStyles[state])}>
      {stateLabels[state]}
    </span>
  );
}
