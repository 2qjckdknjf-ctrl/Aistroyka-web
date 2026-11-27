/**
 * Governed evidence pack for a single skill execution.
 * Static authorization invariants are validated before execution. After a handler
 * has run, missing supporting evidence degrades the outcome to INSUFFICIENT_EVIDENCE
 * instead of turning an already-completed operation into an unaudited exception.
 */

import { AgentError } from "../errors";
import type { SkillDefinition, SkillResult } from "../skills/skill.types";
import type { AgentExecutionContext } from "../types";
import { hasSupportingEvidence, type AgentEvidence } from "./evidence.types";
import type { RuntimeAuthorizationAllowed } from "../security/runtime-authorization";

export const EXECUTION_EVIDENCE_PACK_VERSION = 3 as const;

export type SkillExecutionOutcome = "COMPLETED" | "INSUFFICIENT_EVIDENCE";

export interface AgentExecutionEvidencePack {
  schemaVersion: typeof EXECUTION_EVIDENCE_PACK_VERSION;
  executionId: string;
  requestId: string;
  traceId: string;
  tenantId: string;
  projectId: string;
  userId: string;
  skill: {
    id: string;
    name: string;
    version: string;
    executionMode: SkillDefinition["executionMode"];
    riskLevel: SkillDefinition["riskLevel"];
  };
  authorization: {
    status: "ALLOW";
    policyVersion: string;
    effectivePermissions: string[];
    approvalRequired: boolean;
    approvalId: string | null;
    approvalConsumedAt: string | null;
    level: RuntimeAuthorizationAllowed["level"];
    operationId: string | null;
    inputHash: string | null;
  };
  outcome: SkillExecutionOutcome;
  evidence: AgentEvidence[];
  insufficientEvidence: boolean;
  createdAt: string;
}

/**
 * Validate authorization fields against the trusted skill contract before the
 * mutation-capable handler is invoked. Call once before approval claim and again
 * after claim with requireConsumedApproval=true.
 */
export function validateExecutionAuthorizationForSkill(
  authorization: RuntimeAuthorizationAllowed,
  skill: SkillDefinition,
  options: { requireConsumedApproval?: boolean } = {}
): string[] {
  const errors: string[] = [];
  const trustedApprovalRequired = approvalRequiredBySkill(skill);

  if (authorization.status !== "ALLOW") errors.push("authorization_not_allowed");
  if (!authorization.policyVersion) errors.push("missing_policy_version");
  if (authorization.approvalRequired !== trustedApprovalRequired) {
    errors.push("approval_requirement_mismatch");
  }
  if (trustedApprovalRequired && !authorization.approvalId) {
    errors.push("missing_approval_evidence");
  }
  if (trustedApprovalRequired && !authorization.operationId) {
    errors.push("missing_approved_operation");
  }
  if (trustedApprovalRequired && !authorization.inputHash) {
    errors.push("missing_approved_input_hash");
  }
  if (
    trustedApprovalRequired &&
    options.requireConsumedApproval &&
    !authorization.approvalConsumedAt
  ) {
    errors.push("approval_not_consumed");
  }

  return errors;
}

export function assertExecutionAuthorizationForSkill(
  authorization: RuntimeAuthorizationAllowed,
  skill: SkillDefinition,
  options: { requireConsumedApproval?: boolean } = {}
): void {
  const errors = validateExecutionAuthorizationForSkill(authorization, skill, options);
  if (errors.length === 0) return;
  throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", errors.join(","), 500);
}

export function buildAgentExecutionEvidencePack(input: {
  context: AgentExecutionContext;
  skill: SkillDefinition;
  authorization: RuntimeAuthorizationAllowed;
  result: SkillResult;
  createdAt?: string;
}): AgentExecutionEvidencePack {
  // This is a static invariant and must already have been checked before handler
  // execution. Re-check here to make persisted/imported packs self-validating.
  assertExecutionAuthorizationForSkill(input.authorization, input.skill, {
    requireConsumedApproval: approvalRequiredBySkill(input.skill),
  });

  const missingRequiredEvidence =
    input.skill.requiresEvidence && !hasSupportingEvidence(input.result.evidence);
  const insufficientEvidence = input.result.insufficientEvidence || missingRequiredEvidence;

  const pack: AgentExecutionEvidencePack = {
    schemaVersion: EXECUTION_EVIDENCE_PACK_VERSION,
    executionId: `${input.context.traceId}:${input.skill.name}:${input.skill.version}`,
    requestId: input.context.requestId,
    traceId: input.context.traceId,
    tenantId: input.context.tenantId,
    projectId: input.context.projectId,
    userId: input.context.userId,
    skill: {
      id: input.skill.id,
      name: input.skill.name,
      version: input.skill.version,
      executionMode: input.skill.executionMode,
      riskLevel: input.skill.riskLevel,
    },
    authorization: {
      status: "ALLOW",
      policyVersion: input.authorization.policyVersion,
      effectivePermissions: [...input.authorization.effectivePermissions],
      approvalRequired: input.authorization.approvalRequired,
      approvalId: input.authorization.approvalId,
      approvalConsumedAt: input.authorization.approvalConsumedAt,
      level: input.authorization.level,
      operationId: input.authorization.operationId,
      inputHash: input.authorization.inputHash,
    },
    outcome: insufficientEvidence ? "INSUFFICIENT_EVIDENCE" : "COMPLETED",
    evidence: [...input.result.evidence],
    insufficientEvidence,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  assertValidAgentExecutionEvidencePack(pack, input.skill);
  return pack;
}

export function validateAgentExecutionEvidencePack(
  pack: AgentExecutionEvidencePack,
  skill: SkillDefinition
): string[] {
  const errors: string[] = [];
  const trustedApprovalRequired = approvalRequiredBySkill(skill);

  if (pack.schemaVersion !== EXECUTION_EVIDENCE_PACK_VERSION) errors.push("unsupported_schema_version");
  if (!pack.executionId || !pack.requestId || !pack.traceId) errors.push("missing_execution_identity");
  if (!pack.tenantId || !pack.projectId || !pack.userId) errors.push("missing_execution_scope");
  if (pack.skill.id !== skill.id || pack.skill.name !== skill.name || pack.skill.version !== skill.version) {
    errors.push("skill_identity_mismatch");
  }
  if (pack.skill.executionMode !== skill.executionMode) errors.push("skill_execution_mode_mismatch");
  if (pack.skill.riskLevel !== skill.riskLevel) errors.push("skill_risk_level_mismatch");
  errors.push(
    ...validateExecutionAuthorizationForSkill(
      {
        allowed: true,
        status: "ALLOW",
        policyVersion: pack.authorization.policyVersion as RuntimeAuthorizationAllowed["policyVersion"],
        effectivePermissions: pack.authorization.effectivePermissions,
        approvalRequired: pack.authorization.approvalRequired,
        approvalId: pack.authorization.approvalId,
        approvalConsumedAt: pack.authorization.approvalConsumedAt,
        level: pack.authorization.level,
        operationId: pack.authorization.operationId,
        inputHash: pack.authorization.inputHash,
      },
      skill,
      { requireConsumedApproval: trustedApprovalRequired }
    )
  );

  if (pack.outcome === "COMPLETED") {
    if (pack.insufficientEvidence) errors.push("completed_with_insufficient_evidence");
    if (skill.requiresEvidence && !hasSupportingEvidence(pack.evidence)) {
      errors.push("missing_supporting_evidence");
    }
  } else if (!pack.insufficientEvidence) {
    errors.push("insufficient_outcome_without_flag");
  }

  return [...new Set(errors)];
}

export function assertValidAgentExecutionEvidencePack(
  pack: AgentExecutionEvidencePack,
  skill: SkillDefinition
): void {
  const errors = validateAgentExecutionEvidencePack(pack, skill);
  if (errors.length === 0) return;

  if (errors.includes("missing_supporting_evidence") || errors.includes("completed_with_insufficient_evidence")) {
    throw new AgentError("AGENT_INSUFFICIENT_EVIDENCE", errors.join(","), 422);
  }

  throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", errors.join(","), 500);
}

function approvalRequiredBySkill(skill: SkillDefinition): boolean {
  return skill.requiresApproval || skill.executionMode === "PREPARE" || skill.executionMode === "EXECUTE";
}
