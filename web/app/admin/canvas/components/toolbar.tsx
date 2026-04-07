"use client";

import { useReactFlow } from "@xyflow/react";

interface ToolbarProps {
  onAutoLayout: () => void;
  onReplay: () => void;
  isReplaying: boolean;
  replaySpeed: number;
  onSpeedChange: (speed: number) => void;
  onPauseReplay: () => void;
}

export function Toolbar({
  onAutoLayout,
  onReplay,
  isReplaying,
  replaySpeed,
  onSpeedChange,
  onPauseReplay,
}: ToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-1.5">
      <ToolButton label="+" title="Zoom in" onClick={() => zoomIn()} />
      <ToolButton label="-" title="Zoom out" onClick={() => zoomOut()} />
      <ToolButton label="⊞" title="Fit view" onClick={() => fitView({ padding: 0.1 })} />
      <ToolButton label="⊟" title="Auto layout" onClick={onAutoLayout} />
      <div className="border-t border-[#2a2a2a] my-1" />
      {isReplaying ? (
        <>
          <ToolButton label="⏸" title="Pause" onClick={onPauseReplay} active />
          <ToolButton
            label={`${replaySpeed}x`}
            title="Speed"
            onClick={() => onSpeedChange(replaySpeed === 4 ? 1 : replaySpeed * 2)}
          />
        </>
      ) : (
        <ToolButton label="▶" title="Replay" onClick={onReplay} />
      )}
    </div>
  );
}

function ToolButton({
  label,
  title,
  onClick,
  active = false,
}: {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${
        active
          ? "bg-[#ffd053]/20 text-[#ffd053] border border-[#ffd053]/30"
          : "bg-[#1a1a1a] text-[#666] border border-[#333] hover:text-white hover:border-[#555]"
      }`}
    >
      {label}
    </button>
  );
}
