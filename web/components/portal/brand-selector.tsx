"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Brand } from "@/lib/portal-types";

interface BrandSelectorProps {
  brands: Brand[];
  selected: string;
  onChange: (brandId: string) => void;
}

function BrandLogo({ brand, size = 20 }: { brand: Brand; size?: number }) {
  // Use first color from brand palette as bg, first letter as initial
  const bg = brand.colors[0]?.hex || "#f5a623";
  const initial = brand.name[0].toUpperCase();
  return (
    <div
      className="rounded-md flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
      }}
    >
      <span
        className="font-bold text-white"
        style={{ fontSize: size * 0.45, lineHeight: 1 }}
      >
        {initial}
      </span>
    </div>
  );
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
        {current && <BrandLogo brand={current} size={18} />}
        {current?.name || "Select brand"}
        <ChevronDown size={14} className="text-[#bbb]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#eee] z-50 overflow-hidden">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => { onChange(brand.id); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[#444] hover:bg-[#fafafa] transition-colors"
            >
              <BrandLogo brand={brand} size={20} />
              <span className="flex-1 text-left">{brand.name}</span>
              {brand.id === selected && <Check size={14} className="text-portal-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
