/**
 * Human-in-control policy levels. Authorization is deterministic code, never LLM.
 */

import type { PolicyLevel, SkillExecutionMode, SkillRiskLevel } from "../types";

export const RESTRICTED_ACTION_TYPES = [
  "payment",
  "contract_signature",
  "project_delete",
  "tenant_delete",
  "major_budget_change",
  "final_issue_close",
  "project_close",
  "safety_critical_approval",
] as const;

export type RestrictedActionType = (typeof RESTRICTED_ACTION_TYPES)[number];

export function isRestrictedActionType(actionType: string): boolean {
  return (RESTRICTED_ACTION_TYPES as readonly string[]).includes(actionType);
}

export function policyLevelForMode(mode: SkillExecutionMode): PolicyLevel {
  switch (mode) {
    case "READ":
      return "LEVEL_0_READ";
    case "SUGGEST":
      return "LEVEL_1_SUGGEST";
    case "PREPARE":
      return "LEVEL_2_PREPARE";
    case "EXECUTE":
      return "LEVEL_3_EXECUTE_AFTER_APPROVAL";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function riskRank(level: SkillRiskLevel): number {
  switch (level) {
    case "LOW":
      return 1;
    case "MEDIUM":
      return 2;
    case "HIGH":
      return 3;
    case "CRITICAL":
      return 4;
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}
