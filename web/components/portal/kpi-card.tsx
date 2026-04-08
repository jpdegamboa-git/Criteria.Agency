import { cn } from "@/lib/utils";
import type { KPI } from "@/lib/portal-types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColor = { up: "text-[#00c2a8]", down: "text-[#ff6b6b]", flat: "text-portal-text-muted" };

export function KPICard({ label, value, delta, trend, secondary }: KPI) {
  const TrendIcon = trend ? trendIcon[trend] : null;
  return (
    <div className="bg-white rounded-2xl p-5 portal-shadow">
      <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-[800] tracking-[-1px] text-portal-text leading-none">{value}</span>
        {delta && trend && TrendIcon && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor[trend])}>
            <TrendIcon size={14} />{delta}
          </span>
        )}
      </div>
      {secondary && <p className="text-[11px] text-portal-text-muted mt-1">{secondary}</p>}
    </div>
  );
}
