import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface PortalCardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function PortalCard({ className, noPadding, children, ...props }: PortalCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl portal-shadow", !noPadding && "p-5", className)} {...props}>
      {children}
    </div>
  );
}
