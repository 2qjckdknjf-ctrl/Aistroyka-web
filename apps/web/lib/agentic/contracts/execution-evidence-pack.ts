/**
 * Governed evidence pack for a single skill execution.
 * Static authorization invariants are validated before execution. After a handler
 * has run, missing supporting evidence degrades the outcome to INSUFFICIENT_EVIDENCE
 * instead of turning an already-completed operation into an unaudited exception.
 */

import { AgentError } from "../errors";
import { isRestrictedActionType, policyLevelForMode } from "../policy/policy-levels";
import type { SkillDefinition, SkillResult } from "../skills/skill.types";
import type { AgentExecutionContext, SkillExecutionMode } from "../types";
import { hasSupportingEvidence, type AgentEvidence } from "./evidence.types";
import {
  RUNTIME_AUTHZ_POLICY_VERSION,
  type RuntimeAuthorizationAllowed,
  type RuntimeAuthorizationDecision,
} from "../security/runtime-authorization";

export const EXECUTION_EVIDENCE_PACK_VERSION = 5 as const;

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
    status: RuntimeAuthorizationDecision["status"];
    policyVersion: string;
    effectivePermissions: string[];
    approvalRequired: boolean;
    approvalId: string | null;
    approvalConsumedAt: string | null;
    approvalExpiresAt: string | null;
    level: RuntimeAuthorizationAllowed["level"];
    operationId: string | null;
    actionType: string | null;
    inputHash: string | null;
  };
  outcome: SkillExecutionOutcome;
  evidence: AgentEvidence[];
  insufficientEvidence: boolean;
  createdAt: string;
}

interface AuthorizationEvidenceLike {
  status: RuntimeAuthorizationDecision["status"];
  policyVersion: string;
  effectivePermissions: readonly string[];
  approvalRequired: boolean;
  approvalId: string | null;
  approvalConsumedAt: string | null;
  approvalExpiresAt: string | null;
  level: RuntimeAuthorizationAllowed["level"];
  operationId: string | null;
  actionType: string | null;
  inputHash: string | null;
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
  return validateAuthorizationEvidence(authorization, skill, options);
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
      status: input.authorization.status,
      policyVersion: input.authorization.policyVersion,
      effectivePermissions: [...input.authorization.effectivePermissions],
      approvalRequired: input.authorization.approvalRequired,
      approvalId: input.authorization.approvalId,
      approvalConsumedAt: input.authorization.approvalConsumedAt,
      approvalExpiresAt: input.authorization.approvalExpiresAt,
      level: input.authorization.level,
      operationId: input.authorization.operationId,
      actionType: input.authorization.actionType,
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

  // Validate the authorization record exactly as persisted. Never coerce a recorded
  // DENY/REQUIRE_APPROVAL decision into ALLOW during evidence-pack validation.
  errors.push(
    ...validateAuthorizationEvidence(pack.authorization, skill, {
      requireConsumedApproval: trustedApprovalRequired,
    })
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

function validateAuthorizationEvidence(
  authorization: AuthorizationEvidenceLike,
  skill: SkillDefinition,
  options: { requireConsumedApproval?: boolean } = {}
): string[] {
  const errors: string[] = [];
  const trustedApprovalRequired = approvalRequiredBySkill(skill);
  const requiredModeCapability = modeCapabilityFor(skill.executionMode);
  const expectedPolicyLevel = policyLevelForMode(skill.executionMode);
  const policyVersion = normalizedText(authorization.policyVersion);
  const approvalId = normalizedText(authorization.approvalId);
  const operationId = normalizedText(authorization.operationId);
  const actionType = normalizedText(authorization.actionType);
  const inputHash = normalizedText(authorization.inputHash);
  const approvalConsumedAt = normalizedText(authorization.approvalConsumedAt);
  const approvalExpiresAt = normalizedText(authorization.approvalExpiresAt);

  if (authorization.status !== "ALLOW") errors.push("authorization_not_allowed");
  if (!policyVersion) {
    errors.push("missing_policy_version");
  } else if (policyVersion !== RUNTIME_AUTHZ_POLICY_VERSION) {
    errors.push(`unsupported_policy_version:${policyVersion}`);
  }
  if (authorization.level !== expectedPolicyLevel) {
    errors.push(`authorization_policy_level_mismatch:${expectedPolicyLevel}`);
  }
  if (!authorization.effectivePermissions.includes(requiredModeCapability)) {
    errors.push(`missing_effective_mode_capability:${requiredModeCapability}`);
  }
  for (const required of skill.requiredPermissions) {
    if (!authorization.effectivePermissions.includes(required)) {
      errors.push(`missing_effective_permission:${required}`);
    }
  }
  if (authorization.approvalRequired !== trustedApprovalRequired) {
    errors.push("approval_requirement_mismatch");
  }
  if (trustedApprovalRequired && !approvalId) {
    errors.push("missing_approval_evidence");
  }
  if (trustedApprovalRequired && !operationId) {
    errors.push("missing_approved_operation");
  }
  if (trustedApprovalRequired && !actionType) {
    errors.push("missing_approved_action_type");
  }
  if (trustedApprovalRequired && actionType && isRestrictedActionType(actionType)) {
    errors.push(`restricted_approved_action_type:${actionType}`);
  }
  if (trustedApprovalRequired && !inputHash) {
    errors.push("missing_approved_input_hash");
  }
  if (trustedApprovalRequired && options.requireConsumedApproval && !approvalConsumedAt) {
    errors.push("approval_not_consumed");
  }

  const consumedAtMs = approvalConsumedAt ? Date.parse(approvalConsumedAt) : null;
  if (approvalConsumedAt && !Number.isFinite(consumedAtMs)) {
    errors.push("approval_consumed_at_invalid");
  }
  const expiresAtMs = approvalExpiresAt ? Date.parse(approvalExpiresAt) : null;
  if (approvalExpiresAt && !Number.isFinite(expiresAtMs)) {
    errors.push("approval_expiry_invalid");
  }
  if (
    consumedAtMs !== null &&
    expiresAtMs !== null &&
    Number.isFinite(consumedAtMs) &&
    Number.isFinite(expiresAtMs) &&
    consumedAtMs >= expiresAtMs
  ) {
    errors.push("approval_consumed_at_or_after_expiry");
  }

  return errors;
}

function normalizedText(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function approvalRequiredBySkill(skill: SkillDefinition): boolean {
  return skill.requiresApproval || skill.executionMode === "PREPARE" || skill.executionMode === "EXECUTE";
}

function modeCapabilityFor(mode: SkillExecutionMode): string {
  switch (mode) {
    case "READ":
      return "mode:read";
    case "SUGGEST":
      return "mode:suggest";
    case "PREPARE":
      return "mode:prepare";
    case "EXECUTE":
      return "mode:execute";
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}
