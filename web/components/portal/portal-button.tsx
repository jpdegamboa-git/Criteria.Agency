import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PortalButtonVariant = "primary" | "secondary" | "accent" | "icon";
type PortalButtonSize = "sm" | "md" | "lg";

interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PortalButtonVariant;
  size?: PortalButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<PortalButtonVariant, string> = {
  primary: [
    "bg-[#111] text-white",
    "shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
    "hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:-translate-y-0.5",
    "active:translate-y-0 active:shadow-[0_1px_4px_rgba(0,0,0,0.2)]",
  ].join(" "),
  secondary: [
    "bg-white text-[#444]",
    "border border-[#e8e8e8]",
    "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    "hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:border-[#ddd]",
    "active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
  ].join(" "),
  accent: [
    "bg-[#f5a623] text-white",
    "shadow-[0_2px_8px_rgba(245,166,35,0.3)]",
    "hover:shadow-[0_4px_16px_rgba(245,166,35,0.4)] hover:-translate-y-0.5 hover:bg-[#e89a1a]",
    "active:translate-y-0 active:shadow-[0_1px_4px_rgba(245,166,35,0.2)]",
  ].join(" "),
  icon: [
    "bg-white text-[#444]",
    "border border-[#e8e8e8]",
    "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    "hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
    "active:translate-y-0",
    "!p-0 flex items-center justify-center",
  ].join(" "),
};

const sizeStyles: Record<PortalButtonSize, string> = {
  sm: "text-[11px] px-3 py-1.5 rounded-[10px]",
  md: "text-xs px-4 py-2 rounded-xl",
  lg: "text-sm px-6 py-2.5 rounded-xl",
};

const iconSizeStyles: Record<PortalButtonSize, string> = {
  sm: "w-7 h-7 rounded-[10px]",
  md: "w-9 h-9 rounded-xl",
  lg: "w-11 h-11 rounded-xl",
};

export function PortalButton({
  variant = "secondary",
  size = "sm",
  icon,
  className,
  children,
  ...props
}: PortalButtonProps) {
  const isIcon = variant === "icon";

  return (
    <button
      className={cn(
        "font-medium transition-all duration-150 cursor-pointer",
        "inline-flex items-center justify-center gap-1.5",
        variantStyles[variant],
        isIcon ? iconSizeStyles[size] : sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
