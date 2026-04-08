"use client";

import React from "react";
import { ActivationChip } from "./activation-chip";
import { MediaDot } from "./media-dot";
import { Plus } from "lucide-react";
import type { Activation, Channel, FunnelStage } from "@/lib/portal-types";
import { CHANNELS, FUNNEL_STAGES } from "@/lib/portal-mock-data";

const channelOrder: Channel[] = [
  "sem", "social_ads", "display", "video_ott",
  "seo_content", "email", "social_org", "influencers",
];
const funnelOrder: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

const channelMediaTypes: Record<Channel, ("paid" | "owned" | "earned")[]> = {
  sem: ["paid"], social_ads: ["paid"], display: ["paid"], video_ott: ["paid"],
  seo_content: ["owned"], email: ["owned"], social_org: ["owned", "earned"], influencers: ["earned"],
};

interface FunnelMatrixProps {
  activations: Activation[];
}

export function FunnelMatrix({ activations }: FunnelMatrixProps) {
  function getCell(channel: Channel, stage: FunnelStage): Activation[] {
    return activations.filter((a) => a.channel === channel && a.funnelStage === stage);
  }

  return (
    <div className="overflow-x-auto">
      {/* Contained grid card — matches PilePeak mockup */}
      <div
        className="bg-white rounded-2xl portal-shadow overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "140px repeat(4, 1fr)",
        }}
      >
        {/* Header row: empty corner + 4 funnel stages */}
        <div className="p-4 border-b border-[#f0f0f0]" />
        {funnelOrder.map((stage) => (
          <div key={stage} className="p-4 text-center border-b border-[#f0f0f0]">
            <p className="text-xs font-semibold text-portal-text">{FUNNEL_STAGES[stage].label}</p>
            <p className="text-[9px] text-portal-text-dim mt-0.5">
              {FUNNEL_STAGES[stage].kpis.join(" · ")}
            </p>
          </div>
        ))}

        {/* Channel rows */}
        {channelOrder.map((channel, rowIdx) => (
          <React.Fragment key={channel}>
            {/* Row label */}
            <div
              key={`${channel}-label`}
              className="p-3 border-r border-[#f0f0f0] flex items-start gap-1.5"
              style={{
                borderBottom: rowIdx < channelOrder.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div className="flex gap-0.5 mt-0.5">
                {channelMediaTypes[channel].map((mt) => (
                  <MediaDot key={mt} type={mt} size={6} />
                ))}
              </div>
              <div>
                <p className="text-[11px] font-medium text-portal-text">{CHANNELS[channel].label}</p>
                <p className="text-[9px] text-portal-text-dim">{CHANNELS[channel].description}</p>
              </div>
            </div>

            {/* Cells */}
            {funnelOrder.map((stage, colIdx) => {
              const cellActivations = getCell(channel, stage);
              return (
                <div
                  key={`${channel}-${stage}`}
                  className="p-2 bg-[#fafafa] flex flex-col gap-1.5"
                  style={{
                    borderBottom: rowIdx < channelOrder.length - 1 ? "1px solid #f0f0f0" : "none",
                    borderRight: colIdx < funnelOrder.length - 1 ? "1px solid #f0f0f0" : "none",
                    minHeight: 72,
                  }}
                >
                  {cellActivations.map((act) => (
                    <ActivationChip key={act.id} activation={act} />
                  ))}
                  <button className="w-full border-[1.5px] border-dashed border-[#e0e0e0] rounded-[10px] py-2 text-portal-text-dim hover:border-portal-accent hover:text-portal-accent transition-all text-xs font-medium flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
