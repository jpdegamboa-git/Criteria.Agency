import { StateBadge } from "./state-badge";
import type { Activation, Channel } from "@/lib/portal-types";
import Link from "next/link";
import { channelIconMap } from "./channel-icons";

const mediaColors: Record<string, string> = {
  paid: "#7c5cfc",
  owned: "#00c2a8",
  earned: "#ff6b6b",
};

// Chip background: near-white gray for all types
const chipBg = "#f8f8fa";

export function ActivationChip({ activation }: { activation: Activation }) {
  const Icon = channelIconMap[activation.channel];
  const color = mediaColors[activation.mediaType];

  return (
    <Link
      href={`/client/campaigns/${activation.campaignId}`}
      className="block rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all"
      style={{ backgroundColor: chipBg }}
    >
      <div className="flex items-start gap-2">
        {/* Channel icon */}
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: "#f0f0f2" }}
        >
          <Icon size={11} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold leading-tight" style={{ color }}>
            {activation.name}
          </p>
          <div className="mt-1">
            <StateBadge state={activation.state} />
          </div>
        </div>
      </div>
      {activation.kpis.length > 0 && (
        <div className="flex gap-1.5 mt-2 ml-7">
          {activation.kpis.map((kpi) => (
            <span
              key={kpi.label}
              className="text-[9px] font-medium bg-white/80 text-portal-text-muted px-1.5 py-0.5 rounded"
            >
              {kpi.label}: {kpi.value}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
