import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  featured?: boolean;
}

export function Card({ featured, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-card border border-surface-border rounded-2xl p-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-transparent",
        featured &&
          "border-2 border-brand-gold shadow-[0_8px_32px_rgba(255,208,83,0.12)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
