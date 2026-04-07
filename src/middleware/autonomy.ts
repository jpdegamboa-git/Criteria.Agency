import type { AutonomyConfig, AutonomyLevel } from "@/shared/engine-types";

type ActionCategory = "internal" | "publish" | "communicate" | "spend" | "gate_pass";

const ACTION_PATTERNS: Array<{ pattern: RegExp; category: ActionCategory }> = [
  { pattern: /publish|post|schedule_content/, category: "publish" },
  { pattern: /send_email|send_message|notify/, category: "communicate" },
  { pattern: /spend|payment|budget|purchase/, category: "spend" },
  { pattern: /gate_pass|auto_approve/, category: "gate_pass" },
];

export function classifyAction(action: string): ActionCategory {
  for (const { pattern, category } of ACTION_PATTERNS) {
    if (pattern.test(action)) return category;
  }
  return "internal";
}

export function resolveEffectiveLevel(
  config: AutonomyConfig,
  motor: string,
  actionCategory: string,
): AutonomyLevel {
  // Most specific first: motor + action
  for (const override of config.overrides) {
    const { scope } = override;
    if (scope.motor === motor && scope.actionType === actionCategory) {
      return override.level;
    }
  }
  // Less specific: action-only or motor-only
  for (const override of config.overrides) {
    const { scope } = override;
    if (!scope.motor && scope.actionType === actionCategory) return override.level;
    if (scope.motor === motor && !scope.actionType) return override.level;
  }
  return config.globalLevel;
}

const APPROVAL_MATRIX: Record<AutonomyLevel, Set<ActionCategory>> = {
  1: new Set(["internal", "publish", "communicate", "spend", "gate_pass"]),
  2: new Set(["publish", "communicate", "spend"]),
  3: new Set(["publish", "communicate", "spend"]),
  4: new Set(["spend"]),
  5: new Set(),
};

export function requiresApproval(
  level: AutonomyLevel,
  actionCategory: ActionCategory,
): boolean {
  return APPROVAL_MATRIX[level].has(actionCategory);
}
