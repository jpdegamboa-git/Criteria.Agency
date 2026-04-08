"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Brand } from "@/lib/portal-types";

interface BrandSelectorProps {
  brands: Brand[];
  selected: string;
  onChange: (brandId: string) => void;
}

export function BrandSelector({ brands, selected, onChange }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = brands.find((b) => b.id === selected);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e8e8] rounded-xl text-xs font-medium text-[#444] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-portal-accent" />
        {current?.name || "Select brand"}
        <ChevronDown size={14} className="text-[#bbb]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#eee] z-50 overflow-hidden">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => { onChange(brand.id); setOpen(false); }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-[#444] hover:bg-[#fafafa] transition-colors"
            >
              <span>{brand.name}</span>
              {brand.id === selected && <Check size={14} className="text-portal-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
