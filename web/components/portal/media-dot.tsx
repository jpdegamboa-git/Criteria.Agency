import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/portal-types";

const dotColors: Record<MediaType, string> = {
  paid: "bg-media-paid",
  owned: "bg-media-owned",
  earned: "bg-media-earned",
};

export function MediaDot({ type, size = 8 }: { type: MediaType; size?: number }) {
  return <span className={cn("inline-block rounded-full", dotColors[type])} style={{ width: size, height: size }} />;
}
