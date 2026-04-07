import { cn } from "@/lib/utils";
import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-white border border-surface-border rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-brand-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-colors",
        className
      )}
      {...props}
    />
  );
}
