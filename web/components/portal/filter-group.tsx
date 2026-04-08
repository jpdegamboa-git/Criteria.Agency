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
    <div className="inline-flex bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5",
            value === opt.value
              ? "bg-[#111] text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              : "text-[#888] hover:text-[#444] hover:bg-[#fafafa]"
          )}
        >
          {opt.dot && (
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: opt.dot }}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
