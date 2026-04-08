import type { Deal } from "@/lib/portal-types";

const tempColors: Record<string, string> = { hot: "#ff6b6b", warm: "#f5a623", cold: "#7c5cfc" };

export function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white rounded-xl p-3 portal-shadow border border-portal-border hover:portal-shadow-hover transition-shadow">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tempColors[deal.temperature] }} />
        <h3 className="text-[11px] font-semibold text-portal-text truncate">{deal.name}</h3>
      </div>
      <p className="text-[10px] text-portal-text-muted mb-2">{deal.description}</p>
      <p className="text-sm font-[800] text-portal-text mb-2">₡{deal.value.toLocaleString()}</p>
      <p className="text-[9px] text-portal-text-dim mb-2">{deal.lastActivity}</p>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full" style={{ width: `${deal.score}%`, backgroundColor: tempColors[deal.temperature] }} />
      </div>
      {deal.touchpoints.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {deal.touchpoints.map((tp) => <span key={tp} className="text-[8px] font-medium bg-gray-50 text-portal-text-dim px-1.5 py-0.5 rounded">{tp}</span>)}
        </div>
      )}
    </div>
  );
}
