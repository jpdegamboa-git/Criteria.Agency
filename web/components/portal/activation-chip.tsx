import { StateBadge } from "./state-badge";
import type { Activation, Channel } from "@/lib/portal-types";
import Link from "next/link";
import {
  Search,
  Share2,
  Monitor,
  Play,
  FileText,
  Mail,
  Users,
  Star,
} from "lucide-react";

const mediaColors: Record<string, string> = {
  paid: "#7c5cfc",
  owned: "#00c2a8",
  earned: "#ff6b6b",
};

const mediaBg: Record<string, string> = {
  paid: "rgba(124, 92, 252, 0.04)",
  owned: "rgba(0, 194, 168, 0.04)",
  earned: "rgba(255, 107, 107, 0.04)",
};

const channelIcons: Record<Channel, typeof Search> = {
  sem: Search,
  social_ads: Share2,
  display: Monitor,
  video_ott: Play,
  seo_content: FileText,
  email: Mail,
  social_org: Users,
  influencers: Star,
};

export function ActivationChip({ activation }: { activation: Activation }) {
  const Icon = channelIcons[activation.channel];
  const color = mediaColors[activation.mediaType];

  return (
    <Link
      href={`/client/campaigns/${activation.campaignId}`}
      className="block rounded-xl p-3 portal-shadow hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all"
      style={{ backgroundColor: mediaBg[activation.mediaType] }}
    >
      <div className="flex items-start gap-2">
        {/* Channel icon */}
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}12` }}
        >
          <Icon size={11} style={{ color }} strokeWidth={2} />
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
