/**
 * Deterministic policy resolver. Never uses an LLM for authorization.
 */

import type { AgentExecutionContext, SkillExecutionMode } from "../types";
import { AgentError } from "../errors";
import type { SkillDefinition } from "../skills/skill.types";
import { isRestrictedActionType, policyLevelForMode } from "./policy-levels";

export interface PolicyCheckInput {
  skill: SkillDefinition;
  context: AgentExecutionContext;
  actionType?: string;
  requestedMode?: SkillExecutionMode;
}

export type PolicyDecision =
  | { allowed: true; approvalRequired: boolean; level: ReturnType<typeof policyLevelForMode> }
  | { allowed: false; code: "AGENT_POLICY_DENIED" | "AGENT_SKILL_NOT_ALLOWED" | "AGENT_RESTRICTED_ACTION"; reason: string };

export function resolveAgentActionPolicy(input: PolicyCheckInput): PolicyDecision {
  const { skill, context, actionType, requestedMode } = input;

  if (!context.tenantId || !context.projectId || !context.userId) {
    return { allowed: false, code: "AGENT_POLICY_DENIED", reason: "missing_scope" };
  }

  if (actionType && isRestrictedActionType(actionType)) {
    return { allowed: false, code: "AGENT_RESTRICTED_ACTION", reason: `restricted:${actionType}` };
  }

  if (requestedMode && requestedMode !== skill.executionMode) {
    if (modeRank(requestedMode) > modeRank(skill.executionMode)) {
      return {
        allowed: false,
        code: "AGENT_POLICY_DENIED",
        reason: `mode_escalation:${requestedMode}`,
      };
    }
  }

  if (skill.managerOnly && !context.roles.some((r) => r === "manager" || r === "admin")) {
    return { allowed: false, code: "AGENT_SKILL_NOT_ALLOWED", reason: "manager_only" };
  }

  if (context.roles.includes("client") && skill.executionMode !== "READ") {
    return { allowed: false, code: "AGENT_SKILL_NOT_ALLOWED", reason: "client_read_only" };
  }

  if (skill.executionMode === "EXECUTE") {
    return {
      allowed: true,
      approvalRequired: true,
      level: policyLevelForMode(skill.executionMode),
    };
  }

  return {
    allowed: true,
    approvalRequired: skill.requiresApproval || skill.executionMode === "PREPARE",
    level: policyLevelForMode(skill.executionMode),
  };
}

export function assertPolicyAllowed(input: PolicyCheckInput): void {
  const decision = resolveAgentActionPolicy(input);
  if (!decision.allowed) {
    throw new AgentError(decision.code, decision.reason, decision.code === "AGENT_RESTRICTED_ACTION" ? 403 : 403);
  }
}

function modeRank(mode: SkillExecutionMode): number {
  switch (mode) {
    case "READ":
      return 0;
    case "SUGGEST":
      return 1;
    case "PREPARE":
      return 2;
    case "EXECUTE":
      return 3;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
