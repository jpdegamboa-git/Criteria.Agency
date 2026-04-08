import { StateBadge } from "./state-badge";
import type { Activation } from "@/lib/portal-types";
import Link from "next/link";

const mediaColors: Record<string, string> = {
  paid: "#7c5cfc",
  owned: "#00c2a8",
  earned: "#ff6b6b",
};

export function ActivationChip({ activation }: { activation: Activation }) {
  return (
    <Link href={`/client/campaigns/${activation.campaignId}`} className="block bg-white rounded-xl p-3 portal-shadow border border-portal-border hover:portal-shadow-hover transition-shadow">
      <p className="text-[11px] font-semibold mb-1" style={{ color: mediaColors[activation.mediaType] }}>{activation.name}</p>
      <StateBadge state={activation.state} />
      {activation.kpis.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {activation.kpis.map((kpi) => (
            <span key={kpi.label} className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-1.5 py-0.5 rounded">{kpi.label}: {kpi.value}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
