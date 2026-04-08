import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step { label: string; status: "completed" | "active" | "pending"; }

export function CampaignStepper({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
              step.status === "completed" && "bg-[#00c2a8] text-white",
              step.status === "active" && "bg-portal-accent text-white",
              step.status === "pending" && "bg-gray-100 text-portal-text-dim"
            )}>
              {step.status === "completed" ? <Check size={14} /> : i + 1}
            </div>
            <span className={cn("text-[9px] mt-1 font-medium", step.status === "active" ? "text-portal-text" : "text-portal-text-muted")}>{step.label}</span>
          </div>
          {i < steps.length - 1 && <div className={cn("w-12 h-0.5 mx-1", step.status === "completed" ? "bg-gradient-to-r from-[#00c2a8] to-portal-accent" : "bg-gray-100")} />}
        </div>
      ))}
    </div>
  );
}
