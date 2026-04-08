"use client";

import { ActivationChip } from "./activation-chip";
import { MediaDot } from "./media-dot";
import { Plus } from "lucide-react";
import type { Activation, Channel, FunnelStage } from "@/lib/portal-types";
import { CHANNELS, FUNNEL_STAGES } from "@/lib/portal-mock-data";

const channelOrder: Channel[] = ["sem", "social_ads", "display", "video_ott", "seo_content", "email", "social_org", "influencers"];
const funnelOrder: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

const channelMediaTypes: Record<Channel, ("paid" | "owned" | "earned")[]> = {
  sem: ["paid"], social_ads: ["paid"], display: ["paid"], video_ott: ["paid"],
  seo_content: ["owned"], email: ["owned"], social_org: ["owned", "earned"], influencers: ["earned"],
};

interface FunnelMatrixProps { activations: Activation[]; }

export function FunnelMatrix({ activations }: FunnelMatrixProps) {
  function getCell(channel: Channel, stage: FunnelStage): Activation[] {
    return activations.filter((a) => a.channel === channel && a.funnelStage === stage);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-36 p-2 text-left" />
            {funnelOrder.map((stage) => (
              <th key={stage} className="p-2 text-left min-w-[200px]">
                <p className="text-xs font-semibold text-portal-text">{FUNNEL_STAGES[stage].label}</p>
                <p className="text-[9px] text-portal-text-dim mt-0.5">{FUNNEL_STAGES[stage].kpis.join(" · ")}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channelOrder.map((channel) => (
            <tr key={channel} className="border-t border-portal-border">
              <td className="p-2 align-top">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">{channelMediaTypes[channel].map((mt) => <MediaDot key={mt} type={mt} size={6} />)}</div>
                  <div>
                    <p className="text-xs font-medium text-portal-text">{CHANNELS[channel].label}</p>
                    <p className="text-[9px] text-portal-text-dim">{CHANNELS[channel].description}</p>
                  </div>
                </div>
              </td>
              {funnelOrder.map((stage) => {
                const cellActivations = getCell(channel, stage);
                return (
                  <td key={stage} className="p-2 align-top">
                    <div className="space-y-2">
                      {cellActivations.map((act) => <ActivationChip key={act.id} activation={act} />)}
                      <button className="w-full border border-dashed border-portal-border rounded-xl p-2 text-portal-text-dim hover:border-portal-accent hover:text-portal-accent transition-colors flex items-center justify-center">
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
