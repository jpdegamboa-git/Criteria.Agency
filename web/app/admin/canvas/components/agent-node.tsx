"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface AgentNodeData {
  label: string;
  agentId: string;
  status: "idle" | "running" | "completed" | "failed";
  level: string;
  [key: string]: unknown;
}

const STATUS_COLORS: Record<string, { border: string; glow: string }> = {
  idle: { border: "#2a2a2a", glow: "none" },
  running: { border: "#ffd053", glow: "0 0 12px rgba(255,208,83,0.3)" },
  completed: { border: "#22c55e", glow: "none" },
  failed: { border: "#ef4444", glow: "0 0 12px rgba(239,68,68,0.3)" },
};

function AgentNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const { border, glow } = STATUS_COLORS[nodeData.status] ?? STATUS_COLORS.idle;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2 hover:!bg-[#ffd053] transition-colors" />
      <div
        className="bg-[#141414] rounded-lg px-3 py-2 cursor-pointer select-none transition-all hover:brightness-110"
        style={{
          border: `1.5px solid ${border}`,
          boxShadow: glow,
          minWidth: 120,
        }}
      >
        <div className="flex items-center gap-2">
          {nodeData.status === "running" && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd053] animate-pulse" />
          )}
          <span className="text-white text-xs font-medium truncate">{nodeData.label}</span>
        </div>
        <span className="text-[#666] text-[10px] font-mono">{nodeData.agentId}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2 hover:!bg-[#ffd053] transition-colors" />
    </>
  );
}

export const AgentNode = memo(AgentNodeComponent);
