import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type BadgeVariant = "turquoise" | "gold" | "coral" | "orange" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  turquoise: "bg-brand-turquoise text-white",
  gold: "bg-brand-gold text-[#1a1a1a]",
  coral: "bg-brand-coral text-white",
  orange: "bg-brand-orange text-white",
  neutral: "bg-surface-border text-brand-dark",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "px-4 py-1 rounded-full text-xs font-bold",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
