"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/portal-types";

const stateColors: Record<string, string> = {
  plan: "#7c5cfc",
  ejecutar: "#e09600",
  seguimiento: "#00a88e",
};

interface CampaignCalendarProps { campaigns: Campaign[]; }

export function CampaignCalendar({ campaigns }: CampaignCalendarProps) {
  const [quarterStart, setQuarterStart] = useState(new Date("2026-04-01"));

  const weeks: Date[] = [];
  for (let i = 0; i < 13; i++) {
    const d = new Date(quarterStart);
    d.setDate(d.getDate() + i * 7);
    weeks.push(d);
  }

  const today = new Date();
  const todayWeekIndex = weeks.findIndex((w) => today >= w && today < new Date(w.getTime() + 7 * 86400000));

  function getCampaignSpan(campaign: Campaign) {
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const startIdx = weeks.findIndex((w) => start >= w && start < new Date(w.getTime() + 7 * 86400000));
    const endIdx = weeks.findIndex((w) => end >= w && end < new Date(w.getTime() + 7 * 86400000));
    return { start: Math.max(0, startIdx === -1 ? 0 : startIdx), end: Math.min(12, endIdx === -1 ? 12 : endIdx) };
  }

  function formatWeek(d: Date) { return `${d.getDate()}/${d.getMonth() + 1}`; }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setQuarterStart(new Date(quarterStart.getTime() - 91 * 86400000))} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft size={16} className="text-portal-text-muted" />
          </button>
          <span className="text-xs font-semibold text-portal-text">Q2 2026</span>
          <button onClick={() => setQuarterStart(new Date(quarterStart.getTime() + 91 * 86400000))} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronRight size={16} className="text-portal-text-muted" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex border-b border-portal-border">
            <div className="w-40 shrink-0 p-2" />
            {weeks.map((w, i) => (
              <div key={i} className={cn("flex-1 p-1 text-center text-[9px] text-portal-text-dim", i === todayWeekIndex && "bg-portal-accent/10 rounded-t")}>{formatWeek(w)}</div>
            ))}
          </div>
          {campaigns.map((campaign) => {
            const span = getCampaignSpan(campaign);
            return (
              <div key={campaign.id} className="flex items-center border-b border-portal-border h-10">
                <div className="w-40 shrink-0 p-2">
                  <p className="text-[11px] font-medium text-portal-text truncate">{campaign.name}</p>
                </div>
                <div className="flex-1 flex relative">
                  {weeks.map((_, i) => (<div key={i} className={cn("flex-1 h-10", i === todayWeekIndex && "bg-portal-accent/5")} />))}
                  <div className="absolute top-2 h-6 rounded-full flex items-center px-2"
                    style={{
                      left: `${(span.start / 13) * 100}%`,
                      width: `${((span.end - span.start + 1) / 13) * 100}%`,
                      backgroundColor: stateColors[campaign.state] + "20",
                      borderWidth: 1,
                      borderStyle: campaign.state === "plan" ? "dashed" : "solid",
                      borderColor: stateColors[campaign.state],
                    }}>
                    <span className="text-[9px] font-medium truncate" style={{ color: stateColors[campaign.state] }}>{campaign.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
