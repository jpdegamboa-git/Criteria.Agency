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
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-portal-border rounded-[10px] text-xs font-medium text-portal-text hover:border-portal-text-dim transition-colors">
        <span className="w-3 h-3 rounded-full bg-portal-accent" />
        {current?.name || "Select brand"}
        <ChevronDown size={14} className="text-portal-text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl portal-shadow border border-portal-border z-50 overflow-hidden">
          {brands.map((brand) => (
            <button key={brand.id} onClick={() => { onChange(brand.id); setOpen(false); }} className="flex items-center justify-between w-full px-3 py-2 text-xs text-portal-text hover:bg-gray-50 transition-colors">
              <span>{brand.name}</span>
              {brand.id === selected && <Check size={14} className="text-portal-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
