/**
 * Governed evidence pack for a single skill execution.
 * Static authorization invariants are validated before execution. After a handler
 * has run, missing supporting evidence degrades the outcome to INSUFFICIENT_EVIDENCE
 * instead of turning an already-completed operation into an unaudited exception.
 */

import { AgentError } from "../errors";
import {
  isRestrictedActionType,
  normalizeActionType,
  policyLevelForMode,
} from "../policy/policy-levels";
import type { SkillDefinition, SkillResult } from "../skills/skill.types";
import type { AgentExecutionContext, SkillExecutionMode } from "../types";
import { hasSupportingEvidence, type AgentEvidence } from "./evidence.types";
import {
  RUNTIME_AUTHZ_POLICY_VERSION,
  type RuntimeAuthorizationAllowed,
  type RuntimeAuthorizationDecision,
} from "../security/runtime-authorization";

export const EXECUTION_EVIDENCE_PACK_VERSION = 7 as const;

export type SkillExecutionOutcome = "COMPLETED" | "INSUFFICIENT_EVIDENCE" | "FAILED";

export type AgentExecutionEvidenceTrustedContext = Pick<
  AgentExecutionContext,
  "requestId" | "traceId" | "tenantId" | "projectId" | "userId"
> & { runId: string };

export interface AgentExecutionEvidencePack {
  schemaVersion: typeof EXECUTION_EVIDENCE_PACK_VERSION;
  runId: string;
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
    approvalApprovedBy: string | null;
    approvalApprovedAt: string | null;
    approvalConsumedAt: string | null;
    approvalExpiresAt: string | null;
    level: RuntimeAuthorizationAllowed["level"];
    operationId: string | null;
    actionType: string | null;
    inputHash: string | null;
  };
  outcome: SkillExecutionOutcome;
  failureCode: string | null;
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
  approvalApprovedBy: string | null;
  approvalApprovedAt: string | null;
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
  runId: string;
  context: AgentExecutionContext;
  skill: SkillDefinition;
  authorization: RuntimeAuthorizationAllowed;
  result: SkillResult;
  createdAt?: string;
}): AgentExecutionEvidencePack {
  assertExecutionAuthorizationForSkill(input.authorization, input.skill, {
    requireConsumedApproval: approvalRequiredBySkill(input.skill),
  });

  const runId = normalizedText(input.runId);
  if (!runId) throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "missing_run_identity", 500);

  const missingRequiredEvidence =
    input.skill.requiresEvidence && !hasSupportingEvidence(input.result.evidence);
  const insufficientEvidence = input.result.insufficientEvidence || missingRequiredEvidence;

  const pack = buildBasePack({
    runId,
    context: input.context,
    skill: input.skill,
    authorization: input.authorization,
    outcome: insufficientEvidence ? "INSUFFICIENT_EVIDENCE" : "COMPLETED",
    failureCode: null,
    evidence: input.result.evidence,
    insufficientEvidence,
    createdAt: input.createdAt,
  });
  assertValidAgentExecutionEvidencePack(pack, input.skill, { ...input.context, runId });
  return pack;
}

/**
 * Preserve the already-authorized/consumed operation even when the handler throws.
 * This is critical for mutation attempts: a failed handler may have partially committed
 * side effects, so the authorization/approval record must not disappear with the error.
 */
export function buildAgentExecutionFailureEvidencePack(input: {
  runId: string;
  context: AgentExecutionContext;
  skill: SkillDefinition;
  authorization: RuntimeAuthorizationAllowed;
  failureCode: string;
  evidence?: AgentEvidence[];
  createdAt?: string;
}): AgentExecutionEvidencePack {
  assertExecutionAuthorizationForSkill(input.authorization, input.skill, {
    requireConsumedApproval: approvalRequiredBySkill(input.skill),
  });
  const runId = normalizedText(input.runId);
  if (!runId) throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "missing_run_identity", 500);
  const failureCode = input.failureCode.trim() || "AGENT_SKILL_FAILED";
  const pack = buildBasePack({
    runId,
    context: input.context,
    skill: input.skill,
    authorization: input.authorization,
    outcome: "FAILED",
    failureCode,
    evidence: input.evidence ?? [],
    insufficientEvidence: false,
    createdAt: input.createdAt,
  });
  assertValidAgentExecutionEvidencePack(pack, input.skill, { ...input.context, runId });
  return pack;
}

export function validateAgentExecutionEvidencePack(
  pack: AgentExecutionEvidencePack,
  skill: SkillDefinition,
  trustedContext: AgentExecutionEvidenceTrustedContext
): string[] {
  const errors: string[] = [];
  const trustedApprovalRequired = approvalRequiredBySkill(skill);
  const trustedRunId = normalizedText(trustedContext.runId);
  const expectedExecutionId = trustedRunId
    ? `${trustedRunId}:${skill.name}:${skill.version}`
    : null;
  const createdAtMs = Date.parse(pack.createdAt);

  if (pack.schemaVersion !== EXECUTION_EVIDENCE_PACK_VERSION) errors.push("unsupported_schema_version");
  if (!pack.runId || !pack.executionId || !pack.requestId || !pack.traceId) {
    errors.push("missing_execution_identity");
  }
  if (!trustedRunId) errors.push("missing_trusted_run_identity");
  if (!pack.tenantId || !pack.projectId || !pack.userId) errors.push("missing_execution_scope");
  if (trustedRunId && pack.runId !== trustedRunId) errors.push("run_id_mismatch");
  if (expectedExecutionId && pack.executionId !== expectedExecutionId) errors.push("execution_id_mismatch");
  if (pack.requestId !== trustedContext.requestId) errors.push("request_id_mismatch");
  if (pack.traceId !== trustedContext.traceId) errors.push("trace_id_mismatch");
  if (pack.tenantId !== trustedContext.tenantId) errors.push("tenant_scope_mismatch");
  if (pack.projectId !== trustedContext.projectId) errors.push("project_scope_mismatch");
  if (pack.userId !== trustedContext.userId) errors.push("user_scope_mismatch");
  if (!Number.isFinite(createdAtMs)) errors.push("pack_created_at_invalid");

  if (pack.skill.id !== skill.id || pack.skill.name !== skill.name || pack.skill.version !== skill.version) {
    errors.push("skill_identity_mismatch");
  }
  if (pack.skill.executionMode !== skill.executionMode) errors.push("skill_execution_mode_mismatch");
  if (pack.skill.riskLevel !== skill.riskLevel) errors.push("skill_risk_level_mismatch");

  errors.push(
    ...validateAuthorizationEvidence(pack.authorization, skill, {
      requireConsumedApproval: trustedApprovalRequired,
      packCreatedAt: Number.isFinite(createdAtMs) ? createdAtMs : undefined,
    })
  );

  if (pack.outcome === "COMPLETED") {
    if (pack.failureCode) errors.push("completed_with_failure_code");
    if (pack.insufficientEvidence) errors.push("completed_with_insufficient_evidence");
    if (skill.requiresEvidence && !hasSupportingEvidence(pack.evidence)) {
      errors.push("missing_supporting_evidence");
    }
  } else if (pack.outcome === "INSUFFICIENT_EVIDENCE") {
    if (pack.failureCode) errors.push("insufficient_outcome_with_failure_code");
    if (!pack.insufficientEvidence) errors.push("insufficient_outcome_without_flag");
  } else if (pack.outcome === "FAILED") {
    if (!normalizedText(pack.failureCode)) errors.push("failed_outcome_without_failure_code");
    if (pack.insufficientEvidence) errors.push("failed_outcome_with_insufficient_flag");
  } else {
    errors.push("unsupported_execution_outcome");
  }

  return [...new Set(errors)];
}

export function assertValidAgentExecutionEvidencePack(
  pack: AgentExecutionEvidencePack,
  skill: SkillDefinition,
  trustedContext: AgentExecutionEvidenceTrustedContext
): void {
  const errors = validateAgentExecutionEvidencePack(pack, skill, trustedContext);
  if (errors.length === 0) return;

  if (errors.includes("missing_supporting_evidence") || errors.includes("completed_with_insufficient_evidence")) {
    throw new AgentError("AGENT_INSUFFICIENT_EVIDENCE", errors.join(","), 422);
  }

  throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", errors.join(","), 500);
}

function buildBasePack(input: {
  runId: string;
  context: AgentExecutionContext;
  skill: SkillDefinition;
  authorization: RuntimeAuthorizationAllowed;
  outcome: SkillExecutionOutcome;
  failureCode: string | null;
  evidence: AgentEvidence[];
  insufficientEvidence: boolean;
  createdAt?: string;
}): AgentExecutionEvidencePack {
  return {
    schemaVersion: EXECUTION_EVIDENCE_PACK_VERSION,
    runId: input.runId,
    executionId: `${input.runId}:${input.skill.name}:${input.skill.version}`,
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
      approvalApprovedBy: input.authorization.approvalApprovedBy,
      approvalApprovedAt: input.authorization.approvalApprovedAt,
      approvalConsumedAt: input.authorization.approvalConsumedAt,
      approvalExpiresAt: input.authorization.approvalExpiresAt,
      level: input.authorization.level,
      operationId: input.authorization.operationId,
      actionType: input.authorization.actionType,
      inputHash: input.authorization.inputHash,
    },
    outcome: input.outcome,
    failureCode: input.failureCode,
    evidence: [...input.evidence],
    insufficientEvidence: input.insufficientEvidence,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function validateAuthorizationEvidence(
  authorization: AuthorizationEvidenceLike,
  skill: SkillDefinition,
  options: { requireConsumedApproval?: boolean; packCreatedAt?: number } = {}
): string[] {
  const errors: string[] = [];
  const trustedApprovalRequired = approvalRequiredBySkill(skill);
  const requiredModeCapability = modeCapabilityFor(skill.executionMode);
  const expectedPolicyLevel = policyLevelForMode(skill.executionMode);
  const policyVersion = normalizedText(authorization.policyVersion);
  const approvalId = normalizedText(authorization.approvalId);
  const approvalApprovedBy = normalizedText(authorization.approvalApprovedBy);
  const approvalApprovedAt = normalizedText(authorization.approvalApprovedAt);
  const operationId = normalizedText(authorization.operationId);
  const rawActionType = normalizedText(authorization.actionType);
  const actionType = rawActionType ? normalizeActionType(rawActionType) : null;
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
  if (trustedApprovalRequired && !approvalId) errors.push("missing_approval_evidence");
  if (trustedApprovalRequired && !approvalApprovedBy) errors.push("missing_approval_approver");
  if (trustedApprovalRequired && !approvalApprovedAt) errors.push("missing_approval_timestamp");
  if (trustedApprovalRequired && !operationId) errors.push("missing_approved_operation");
  if (trustedApprovalRequired && !actionType) errors.push("missing_approved_action_type");
  if (trustedApprovalRequired && actionType && isRestrictedActionType(actionType)) {
    errors.push(`restricted_approved_action_type:${actionType}`);
  }
  if (trustedApprovalRequired && !inputHash) errors.push("missing_approved_input_hash");
  if (trustedApprovalRequired && options.requireConsumedApproval && !approvalConsumedAt) {
    errors.push("approval_not_consumed");
  }

  const approvedAtMs = approvalApprovedAt ? Date.parse(approvalApprovedAt) : null;
  if (approvalApprovedAt && !Number.isFinite(approvedAtMs)) errors.push("approval_approved_at_invalid");
  const consumedAtMs = approvalConsumedAt ? Date.parse(approvalConsumedAt) : null;
  if (approvalConsumedAt && !Number.isFinite(consumedAtMs)) errors.push("approval_consumed_at_invalid");
  const expiresAtMs = approvalExpiresAt ? Date.parse(approvalExpiresAt) : null;
  if (approvalExpiresAt && !Number.isFinite(expiresAtMs)) errors.push("approval_expiry_invalid");

  if (
    approvedAtMs !== null &&
    consumedAtMs !== null &&
    Number.isFinite(approvedAtMs) &&
    Number.isFinite(consumedAtMs) &&
    approvedAtMs > consumedAtMs
  ) {
    errors.push("approval_after_consumption");
  }
  if (
    approvedAtMs !== null &&
    expiresAtMs !== null &&
    Number.isFinite(approvedAtMs) &&
    Number.isFinite(expiresAtMs) &&
    approvedAtMs >= expiresAtMs
  ) {
    errors.push("approval_grant_chronology_invalid");
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
  if (
    options.packCreatedAt !== undefined &&
    approvedAtMs !== null &&
    Number.isFinite(approvedAtMs) &&
    approvedAtMs > options.packCreatedAt
  ) {
    errors.push("approval_after_pack_creation");
  }
  if (
    options.packCreatedAt !== undefined &&
    consumedAtMs !== null &&
    Number.isFinite(consumedAtMs) &&
    consumedAtMs > options.packCreatedAt
  ) {
    errors.push("approval_consumed_after_pack_creation");
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
