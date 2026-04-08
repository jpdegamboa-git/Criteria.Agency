"use client";

import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  dot?: string;
}

interface FilterGroupProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterGroup({ options, value, onChange }: FilterGroupProps) {
  return (
    <div className="inline-flex bg-white border border-portal-border rounded-[10px] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
            value === opt.value ? "bg-portal-text text-white" : "text-portal-text-muted hover:text-portal-text"
          )}
        >
          {opt.dot && <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: opt.dot }} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
