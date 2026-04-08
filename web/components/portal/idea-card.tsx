import { Clock } from "lucide-react";
import { PortalButton } from "@/components/portal/portal-button";
import type { CampaignIdea } from "@/lib/portal-types";

export function IdeaCard({ title, description, tags, urgent, urgencyDays }: CampaignIdea) {
  return (
    <div className="bg-white rounded-2xl p-5 portal-shadow hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-portal-text">{title}</h3>
        {urgent && urgencyDays && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#e09600] bg-[#fff8eb] px-2 py-0.5 rounded-full">
            <Clock size={10} />{urgencyDays} días
          </span>
        )}
      </div>
      <p className="text-[12px] text-portal-text-secondary mb-3 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{tags.type}</span>
        <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{tags.channel}</span>
        <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{tags.time}</span>
      </div>
      <PortalButton variant="accent" size="sm">Crear →</PortalButton>
    </div>
  );
}
