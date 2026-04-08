import type { Opportunity } from "@/lib/portal-types";

const typeColors: Record<string, string> = {
  tendencia: "#00c2a8",
  competencia: "#7c5cfc",
  cultura: "#ff6b6b",
  industria: "#f5a623",
};

const typeLabels: Record<string, string> = {
  tendencia: "Tendencia",
  competencia: "Competencia",
  cultura: "Cultura",
  industria: "Industria",
};

export function OpportunityCard({ type, title, description, action }: Opportunity) {
  return (
    <div className="bg-white rounded-2xl p-4 portal-shadow border border-portal-border">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[type] }} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-portal-text-muted">{typeLabels[type]}</span>
      </div>
      <h3 className="text-[13px] font-semibold text-portal-text mb-1">{title}</h3>
      <p className="text-[11px] text-portal-text-secondary mb-3 leading-relaxed">{description}</p>
      <button className="text-[11px] font-semibold text-portal-accent hover:underline">{action} →</button>
    </div>
  );
}
