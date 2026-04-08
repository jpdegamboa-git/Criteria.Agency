"use client";

import { useState } from "react";
import { Lock, Unlock, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetNode } from "@/lib/portal-types";

// ── Rebalance logic (exported for testing) ──

interface RebalanceInput {
  id: string;
  percentage: number;
  locked: boolean;
}

export function rebalanceSiblings(
  nodes: RebalanceInput[],
  changedId: string,
  newPercentage: number
): RebalanceInput[] {
  const changed = nodes.find((n) => n.id === changedId);
  if (!changed) return nodes;

  const clamped = Math.max(0, Math.min(100, newPercentage));
  const lockedTotal = nodes
    .filter((n) => n.id !== changedId && n.locked)
    .reduce((sum, n) => sum + n.percentage, 0);

  const remaining = 100 - clamped - lockedTotal;
  const unlocked = nodes.filter((n) => n.id !== changedId && !n.locked);
  const unlockTotal = unlocked.reduce((sum, n) => sum + n.percentage, 0);

  return nodes.map((node) => {
    if (node.id === changedId) return { ...node, percentage: clamped };
    if (node.locked) return node;
    const share = unlockTotal > 0 ? node.percentage / unlockTotal : 1 / unlocked.length;
    return { ...node, percentage: Math.max(0, Math.round(remaining * share)) };
  });
}

// ── Component ──

interface BudgetEqualizerProps {
  root: BudgetNode;
  annualBudget: number;
}

export function BudgetEqualizer({ root, annualBudget }: BudgetEqualizerProps) {
  const [path, setPath] = useState<string[]>([]);
  const [data, setData] = useState<BudgetNode>(root);

  function getNodeAtPath(node: BudgetNode, segments: string[]): BudgetNode | null {
    let current: BudgetNode | null = node;
    for (const seg of segments) {
      current = current?.children?.find((c) => c.id === seg) || null;
    }
    return current;
  }

  const currentNode = path.length === 0 ? data : getNodeAtPath(data, path);
  if (!currentNode || !currentNode.children) {
    return (
      <div className="text-xs text-portal-text-muted">
        <button onClick={() => setPath(path.slice(0, -1))} className="flex items-center gap-1 text-portal-accent hover:underline mb-4">
          <ArrowLeft size={14} /> Volver
        </button>
        <p>No hay sub-niveles</p>
      </div>
    );
  }

  function handleDrillDown(childId: string) {
    const child = currentNode?.children?.find((c) => c.id === childId);
    if (child?.children && child.children.length > 0) {
      setPath([...path, childId]);
    }
  }

  function handleSliderChange(childId: string, newPct: number) {
    if (!currentNode?.children) return;
    const rebalanced = rebalanceSiblings(
      currentNode.children.map((c) => ({ id: c.id, percentage: c.percentage, locked: c.locked })),
      childId,
      newPct
    );
    function updateNode(node: BudgetNode, segments: string[], newChildren: RebalanceInput[]): BudgetNode {
      if (segments.length === 0) {
        return {
          ...node,
          children: node.children?.map((child) => {
            const updated = newChildren.find((r) => r.id === child.id);
            if (!updated) return child;
            const newAmount = (node.amount * updated.percentage) / 100;
            return { ...child, percentage: updated.percentage, amount: Math.round(newAmount) };
          }),
        };
      }
      return {
        ...node,
        children: node.children?.map((child) =>
          child.id === segments[0] ? updateNode(child, segments.slice(1), newChildren) : child
        ),
      };
    }
    setData(updateNode(data, path, rebalanced));
  }

  const breadcrumbs = [
    { label: root.label, path: [] as string[] },
    ...path.map((seg, i) => {
      const node = getNodeAtPath(data, path.slice(0, i + 1));
      return { label: node?.label || seg, path: path.slice(0, i + 1) };
    }),
  ];

  // annualBudget is available for future use (e.g. displaying absolute amounts)
  void annualBudget;

  return (
    <div>
      <div className="flex items-center gap-1 mb-4">
        {breadcrumbs.map((bc, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-portal-text-dim" />}
            <button onClick={() => setPath(bc.path)} className={cn("text-xs", i === breadcrumbs.length - 1 ? "font-semibold text-portal-text" : "text-portal-text-muted hover:text-portal-text")}>
              {bc.label}
            </button>
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {currentNode.children.map((child) => {
          const hasChildren = child.children && child.children.length > 0;
          const outOfRange = child.recommended && (child.percentage < child.recommended.min || child.percentage > child.recommended.max);

          return (
            <div key={child.id} className="flex items-center gap-3">
              <button
                onClick={() => hasChildren && handleDrillDown(child.id)}
                className={cn("w-28 text-xs text-left truncate", hasChildren ? "font-medium text-portal-accent hover:underline cursor-pointer" : "text-portal-text-secondary")}
              >
                {child.label}{hasChildren && <ChevronRight size={10} className="inline ml-0.5" />}
              </button>
              <div className="flex-1 relative">
                <input type="range" min={0} max={100} value={child.percentage}
                  onChange={(e) => handleSliderChange(child.id, Number(e.target.value))}
                  disabled={child.locked}
                  className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-portal-text" />
                {child.recommended && (
                  <div className="absolute top-0 h-1.5 bg-[#00c2a8]/20 rounded-full pointer-events-none"
                    style={{ left: `${child.recommended.min}%`, width: `${child.recommended.max - child.recommended.min}%` }} />
                )}
              </div>
              <span className={cn("w-10 text-right text-xs font-semibold", outOfRange ? "text-[#ff6b6b]" : "text-portal-text")}>{child.percentage}%</span>
              <span className="w-16 text-right text-[11px] text-portal-text-muted">${child.amount.toLocaleString()}</span>
              <button
                onClick={() => {
                  function toggleLock(node: BudgetNode, segments: string[], targetId: string): BudgetNode {
                    if (segments.length === 0) {
                      return { ...node, children: node.children?.map((c) => c.id === targetId ? { ...c, locked: !c.locked } : c) };
                    }
                    return { ...node, children: node.children?.map((c) => c.id === segments[0] ? toggleLock(c, segments.slice(1), targetId) : c) };
                  }
                  setData(toggleLock(data, path, child.id));
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {child.locked ? <Lock size={12} className="text-portal-text-muted" /> : <Unlock size={12} className="text-portal-text-dim" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
