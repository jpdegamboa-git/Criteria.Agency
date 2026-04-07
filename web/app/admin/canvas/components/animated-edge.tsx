"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export interface AnimatedEdgeData {
  animated: boolean;
  connectionType: "pipeline" | "manual";
  [key: string]: unknown;
}

function AnimatedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const isAnimated = edgeData?.animated ?? false;
  const isPipeline = (edgeData?.connectionType ?? "pipeline") === "pipeline";

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isAnimated ? "#ffd053" : "#2a2a2a",
          strokeWidth: isAnimated ? 1.5 : 1,
          strokeDasharray: isPipeline ? "none" : "5 5",
          opacity: isAnimated ? 0.8 : 0.4,
          ...style,
        }}
      />
      {isAnimated && (
        <circle r="3" fill="#ffd053">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
