/**
 * Governed evidence pack for a single skill execution.
 * A completed execution cannot be represented as governed/valid without
 * authorization trace and any evidence required by the skill contract.
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

export function buildAgentExecutionEvidencePack(input: {
  context: AgentExecutionContext;
  skill: SkillDefinition;
  authorization: RuntimeAuthorizationAllowed;
  result: SkillResult;
  createdAt?: string;
}): AgentExecutionEvidencePack {
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
    outcome: input.result.insufficientEvidence ? "INSUFFICIENT_EVIDENCE" : "COMPLETED",
    evidence: [...input.result.evidence],
    insufficientEvidence: input.result.insufficientEvidence,
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

  if (pack.schemaVersion !== EXECUTION_EVIDENCE_PACK_VERSION) errors.push("unsupported_schema_version");
  if (!pack.executionId || !pack.requestId || !pack.traceId) errors.push("missing_execution_identity");
  if (!pack.tenantId || !pack.projectId || !pack.userId) errors.push("missing_execution_scope");
  if (pack.skill.id !== skill.id || pack.skill.name !== skill.name || pack.skill.version !== skill.version) {
    errors.push("skill_identity_mismatch");
  }
  if (pack.authorization.status !== "ALLOW") errors.push("authorization_not_allowed");
  if (!pack.authorization.policyVersion) errors.push("missing_policy_version");
  if (pack.authorization.approvalRequired && !pack.authorization.approvalId) {
    errors.push("missing_approval_evidence");
  }
  if (pack.authorization.approvalRequired && !pack.authorization.operationId) {
    errors.push("missing_approved_operation");
  }
  if (pack.authorization.approvalRequired && !pack.authorization.inputHash) {
    errors.push("missing_approved_input_hash");
  }
  if (pack.authorization.approvalRequired && !pack.authorization.approvalConsumedAt) {
    errors.push("approval_not_consumed");
  }

  if (pack.outcome === "COMPLETED") {
    if (pack.insufficientEvidence) errors.push("completed_with_insufficient_evidence");
    if (skill.requiresEvidence && !hasSupportingEvidence(pack.evidence)) {
      errors.push("missing_supporting_evidence");
    }
  }

  return errors;
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
