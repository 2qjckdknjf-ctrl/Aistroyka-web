/**
 * Deterministic intent → required read skills.
 * LLM may only add skills from the allowlist; it cannot invent skills.
 */

import type { ReadSkillId } from "../skills/skill-registry";

export type AgentIntent =
  | "delivery_threat"
  | "overdue_tasks"
  | "critical_issues"
  | "attention"
  | "last_7_days"
  | "general";

const DELIVERY_PACK: ReadSkillId[] = [
  "get_project_state",
  "get_overdue_tasks",
  "get_open_issues",
  "get_recent_reports",
  "get_project_risks",
  "calculate_project_health",
  "find_project_blockers",
];

export function resolveAgentIntent(message: string): AgentIntent {
  const m = message.toLowerCase();
  if (
    /угрожа|сдач|срок|deadline|delay|handover|delivery/.test(m)
  ) {
    return "delivery_threat";
  }
  if (/просроч|overdue|over-due/.test(m)) return "overdue_tasks";
  if (/критич|critical|blocking|punch/.test(m)) return "critical_issues";
  if (/вниман|attention|requires attention/.test(m)) return "attention";
  if (/7 дн|last 7|последн/.test(m)) return "last_7_days";
  return "general";
}

export function skillsForIntent(intent: AgentIntent): ReadSkillId[] {
  switch (intent) {
    case "delivery_threat":
    case "attention":
    case "general":
      return DELIVERY_PACK;
    case "overdue_tasks":
      return ["get_overdue_tasks", "calculate_project_health", "find_project_blockers"];
    case "critical_issues":
      return ["get_open_issues", "get_project_risks", "find_project_blockers"];
    case "last_7_days":
      return ["get_project_state", "get_recent_reports", "get_project_evidence"];
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

export function isRequiredSkill(intent: AgentIntent, skill: string): boolean {
  return skillsForIntent(intent).includes(skill as ReadSkillId);
}
