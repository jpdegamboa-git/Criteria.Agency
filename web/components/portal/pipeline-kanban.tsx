import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/lib/portal-types";

const stages: { id: DealStage; label: string }[] = [
  { id: "new", label: "Nuevo" },
  { id: "contacted", label: "Contactado" },
  { id: "proposal", label: "Propuesta" },
  { id: "negotiation", label: "Negociación" },
  { id: "won", label: "Ganado" },
];

export function PipelineKanban({ deals }: { deals: Deal[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
        return (
          <div key={stage.id} className="flex-1 min-w-[200px]">
            <div className={cn("rounded-t-xl px-3 py-2 border-b-2", stage.id === "won" ? "border-[#00c2a8]" : "border-portal-border")}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-portal-text">{stage.label}</p>
                <span className="text-[10px] text-portal-text-dim">{stageDeals.length}</span>
              </div>
              <p className="text-[10px] text-portal-text-muted">₡{totalValue.toLocaleString()}</p>
            </div>
            <div className="space-y-2 mt-2">{stageDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)}</div>
          </div>
        );
      })}
    </div>
  );
}
