import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "pill" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1a1a1a] text-white rounded-xl px-10 py-4 font-semibold hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-lg transition-all",
  secondary:
    "bg-transparent border border-surface-border text-brand-dark rounded-xl px-8 py-4 hover:border-brand-dark hover:bg-black/[0.02] transition-all",
  pill: "bg-[#1a1a1a] text-white rounded-full px-6 py-2 text-sm font-semibold hover:bg-[#333] hover:-translate-y-px hover:shadow-md transition-all",
  ghost: "bg-transparent text-brand-muted hover:text-brand-dark transition-colors",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </button>
  );
}
