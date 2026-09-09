import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AgentExecutionContext } from "../types";
import type { SkillDefinition, SkillResult } from "../skills/skill.types";
import {
  RUNTIME_AUTHZ_POLICY_VERSION,
  type RuntimeAuthorizationAllowed,
} from "../security/runtime-authorization";
import {
  buildAgentExecutionEvidencePack,
  buildAgentExecutionFailureEvidencePack,
  EXECUTION_EVIDENCE_PACK_VERSION,
  validateAgentExecutionEvidencePack,
  type AgentExecutionEvidencePack,
} from "./execution-evidence-pack";
import { toAgentEvidence } from "./evidence.types";

function skill(
  requiresEvidence = true,
  overrides: Partial<SkillDefinition> = {}
): SkillDefinition {
  return {
    id: "inspect_project",
    name: "inspect_project",
    version: "1",
    description: "test",
    riskLevel: "LOW",
    executionMode: "READ",
    requiredPermissions: ["project:read"],
    inputSchema: z.object({}),
    outputSchema: z.unknown(),
    requiresProject: true,
    requiresEvidence,
    requiresApproval: false,
    handler: "inspect_project",
    ...overrides,
  };
}

function approvalSkill(requiresEvidence = false): SkillDefinition {
  return skill(requiresEvidence, {
    id: "apply_project_change",
    name: "apply_project_change",
    executionMode: "EXECUTE",
    riskLevel: "HIGH",
    requiresApproval: true,
    handler: "apply_project_change",
  });
}

function ctx(overrides: Partial<AgentExecutionContext> = {}): AgentExecutionContext {
  return {
    tenantId: "tenant-1",
    projectId: "project-1",
    userId: "user-1",
    actorType: "user",
    tenantRole: "member",
    projectRole: "manager",
    roles: ["manager"],
    permissions: ["read"],
    requestId: "request-1",
    traceId: "trace-1",
    locale: "en",
    source: "WEB",
    timestamp: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

function authorization(overrides: Partial<RuntimeAuthorizationAllowed> = {}): RuntimeAuthorizationAllowed {
  return {
    allowed: true,
    status: "ALLOW",
    policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
    effectivePermissions: ["mode:read", "project:read"],
    approvalRequired: false,
    approvalId: null,
    approvalApprovedBy: null,
    approvalApprovedAt: null,
    approvalConsumedAt: null,
    approvalExpiresAt: null,
    level: "LEVEL_0_READ",
    operationId: null,
    actionType: null,
    inputHash: null,
    ...overrides,
  };
}

function approvedAuthorization(
  overrides: Partial<RuntimeAuthorizationAllowed> = {}
): RuntimeAuthorizationAllowed {
  return authorization({
    effectivePermissions: ["mode:execute", "project:read"],
    approvalRequired: true,
    approvalId: "approval-1",
    approvalApprovedBy: "owner-1",
    approvalApprovedAt: "2026-09-08T00:00:00.000Z",
    approvalConsumedAt: "2026-09-08T00:00:30.000Z",
    approvalExpiresAt: "2026-09-08T01:00:00.000Z",
    level: "LEVEL_3_EXECUTE_AFTER_APPROVAL",
    operationId: "operation-1",
    actionType: "update_project",
    inputHash: "hash-1",
    ...overrides,
  });
}

function completedReadPack(): AgentExecutionEvidencePack {
  const definition = skill();
  return {
    schemaVersion: EXECUTION_EVIDENCE_PACK_VERSION,
    executionId: "trace-1:inspect_project:1",
    requestId: "request-1",
    traceId: "trace-1",
    tenantId: "tenant-1",
    projectId: "project-1",
    userId: "user-1",
    skill: {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      executionMode: definition.executionMode,
      riskLevel: definition.riskLevel,
    },
    authorization: {
      status: "ALLOW",
      policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
      effectivePermissions: ["mode:read", "project:read"],
      approvalRequired: false,
      approvalId: null,
      approvalApprovedBy: null,
      approvalApprovedAt: null,
      approvalConsumedAt: null,
      approvalExpiresAt: null,
      level: "LEVEL_0_READ",
      operationId: null,
      actionType: null,
      inputHash: null,
    },
    outcome: "COMPLETED",
    failureCode: null,
    evidence: [
      toAgentEvidence({
        type: "DATABASE_STATE",
        sourceEntityType: "projects",
        sourceEntityId: "project-1",
      }),
    ],
    insufficientEvidence: false,
    createdAt: "2026-09-08T00:01:00.000Z",
  };
}

function validate(pack: AgentExecutionEvidencePack, definition: SkillDefinition = skill()): string[] {
  return validateAgentExecutionEvidencePack(pack, definition, ctx());
}

describe("agent execution evidence pack", () => {
  it("builds a governed pack for a supported execution", () => {
    const result: SkillResult = {
      output: { ok: true },
      evidence: [
        toAgentEvidence({
          type: "DATABASE_STATE",
          sourceEntityType: "projects",
          sourceEntityId: "project-1",
        }),
      ],
      insufficientEvidence: false,
    };

    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: skill(),
      authorization: authorization(),
      result,
      createdAt: "2026-09-08T00:01:00.000Z",
    });

    expect(pack.schemaVersion).toBe(EXECUTION_EVIDENCE_PACK_VERSION);
    expect(pack.outcome).toBe("COMPLETED");
    expect(pack.failureCode).toBeNull();
    expect(pack.authorization.policyVersion).toBe(RUNTIME_AUTHZ_POLICY_VERSION);
    expect(pack.evidence).toHaveLength(1);
  });

  it("rejects a copied pack from another tenant/project/user or run context", () => {
    const pack = completedReadPack();
    const wrongContext = ctx({
      tenantId: "tenant-2",
      projectId: "project-2",
      userId: "user-2",
      requestId: "request-2",
      traceId: "trace-2",
    });
    const errors = validateAgentExecutionEvidencePack(pack, skill(), wrongContext);
    expect(errors).toEqual(
      expect.arrayContaining([
        "execution_id_mismatch",
        "request_id_mismatch",
        "trace_id_mismatch",
        "tenant_scope_mismatch",
        "project_scope_mismatch",
        "user_scope_mismatch",
      ])
    );
  });

  it("rejects a forged completed evidence-required pack without supporting evidence", () => {
    const pack = completedReadPack();
    pack.evidence = [];
    expect(validate(pack)).toContain("missing_supporting_evidence");
  });

  it("rejects a persisted pack whose actual authorization decision is not ALLOW", () => {
    const forged = completedReadPack();
    forged.authorization.status = "DENY";
    expect(validate(forged)).toContain("authorization_not_allowed");
  });

  it("rejects an unknown recorded authorization policy version", () => {
    const forged = completedReadPack();
    forged.authorization.policyVersion = "agentic-runtime-authz-v999";
    expect(validate(forged)).toContain("unsupported_policy_version:agentic-runtime-authz-v999");
  });

  it("rejects a policy level that the trusted skill mode could not have produced", () => {
    const forged = completedReadPack();
    forged.authorization.level = "LEVEL_3_EXECUTE_AFTER_APPROVAL";
    expect(validate(forged)).toContain("authorization_policy_level_mismatch:LEVEL_0_READ");
  });

  it("rejects a persisted pack missing mode or domain permissions", () => {
    const noMode = completedReadPack();
    noMode.authorization.effectivePermissions = ["project:read"];
    expect(validate(noMode)).toContain("missing_effective_mode_capability:mode:read");

    const noDomain = completedReadPack();
    noDomain.authorization.effectivePermissions = ["mode:read"];
    expect(validate(noDomain)).toContain("missing_effective_permission:project:read");
  });

  it("rejects governed completion without complete approval evidence", () => {
    const definition = approvalSkill();
    const result: SkillResult = { output: {}, evidence: [], insufficientEvidence: false };
    expect(() =>
      buildAgentExecutionEvidencePack({
        context: ctx(),
        skill: definition,
        authorization: approvedAuthorization({
          approvalId: null,
          approvalApprovedBy: null,
          approvalApprovedAt: null,
          approvalConsumedAt: null,
        }),
        result,
      })
    ).toThrow();
  });

  it("records human approver, full chronology and immutable operation binding", () => {
    const definition = approvalSkill();
    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
      createdAt: "2026-09-08T00:00:45.000Z",
    });

    expect(pack.authorization).toMatchObject({
      approvalId: "approval-1",
      approvalApprovedBy: "owner-1",
      approvalApprovedAt: "2026-09-08T00:00:00.000Z",
      approvalConsumedAt: "2026-09-08T00:00:30.000Z",
      approvalExpiresAt: "2026-09-08T01:00:00.000Z",
      operationId: "operation-1",
      actionType: "update_project",
      inputHash: "hash-1",
    });
  });

  it("rejects invalid persisted approval chronology", () => {
    const definition = approvalSkill();
    const valid = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
      createdAt: "2026-09-08T00:00:45.000Z",
    });

    const afterExpiry: AgentExecutionEvidencePack = {
      ...valid,
      authorization: { ...valid.authorization, approvalConsumedAt: "2026-09-08T01:00:00.000Z" },
      createdAt: "2026-09-08T01:00:01.000Z",
    };
    expect(validateAgentExecutionEvidencePack(afterExpiry, definition, ctx())).toContain(
      "approval_consumed_at_or_after_expiry"
    );

    const approvedAfterConsumed: AgentExecutionEvidencePack = {
      ...valid,
      authorization: { ...valid.authorization, approvalApprovedAt: "2026-09-08T00:00:31.000Z" },
    };
    expect(validateAgentExecutionEvidencePack(approvedAfterConsumed, definition, ctx())).toContain(
      "approval_after_consumption"
    );
  });

  it("rejects malformed persisted approval timestamps", () => {
    const definition = approvalSkill();
    const valid = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
      createdAt: "2026-09-08T00:00:45.000Z",
    });

    const badExpiry = { ...valid, authorization: { ...valid.authorization, approvalExpiresAt: "bad" } };
    expect(validateAgentExecutionEvidencePack(badExpiry, definition, ctx())).toContain("approval_expiry_invalid");

    const badApproved = { ...valid, authorization: { ...valid.authorization, approvalApprovedAt: "bad" } };
    expect(validateAgentExecutionEvidencePack(badApproved, definition, ctx())).toContain("approval_approved_at_invalid");
  });

  it("rejects restricted action types case-insensitively", () => {
    const definition = approvalSkill();
    const valid = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
      createdAt: "2026-09-08T00:00:45.000Z",
    });
    const forged = {
      ...valid,
      authorization: { ...valid.authorization, actionType: " PaYmEnT " },
    };
    expect(validateAgentExecutionEvidencePack(forged, definition, ctx())).toContain(
      "restricted_approved_action_type:payment"
    );
  });

  it("degrades missing required evidence after execution instead of throwing", () => {
    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: approvalSkill(true),
      authorization: approvedAuthorization(),
      result: { output: { mutationCommitted: true }, evidence: [], insufficientEvidence: false },
      createdAt: "2026-09-08T00:00:45.000Z",
    });
    expect(pack.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(pack.insufficientEvidence).toBe(true);
  });

  it("builds a re-validatable governed FAILED pack for a handler error", () => {
    const definition = approvalSkill();
    const pack = buildAgentExecutionFailureEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      failureCode: "AGENT_SKILL_FAILED",
      createdAt: "2026-09-08T00:00:45.000Z",
    });
    expect(pack.outcome).toBe("FAILED");
    expect(pack.failureCode).toBe("AGENT_SKILL_FAILED");
    expect(pack.authorization.approvalConsumedAt).toBe("2026-09-08T00:00:30.000Z");
    expect(validateAgentExecutionEvidencePack(pack, definition, ctx())).toEqual([]);
  });

  it("rejects a pack that falsely declares approval unnecessary", () => {
    const definition = approvalSkill();
    const valid = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
      createdAt: "2026-09-08T00:00:45.000Z",
    });
    const forged: AgentExecutionEvidencePack = {
      ...valid,
      authorization: {
        ...valid.authorization,
        approvalRequired: false,
        approvalId: null,
        approvalApprovedBy: null,
        approvalApprovedAt: null,
        approvalConsumedAt: null,
        approvalExpiresAt: null,
        operationId: null,
        actionType: null,
        inputHash: null,
      },
    };
    const errors = validateAgentExecutionEvidencePack(forged, definition, ctx());
    expect(errors).toEqual(
      expect.arrayContaining([
        "approval_requirement_mismatch",
        "missing_approval_evidence",
        "missing_approval_approver",
        "missing_approval_timestamp",
        "missing_approved_operation",
        "missing_approved_action_type",
        "missing_approved_input_hash",
        "approval_not_consumed",
      ])
    );
  });

  it("allows an explicit insufficient-evidence outcome without pretending success", () => {
    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: skill(),
      authorization: authorization(),
      result: { output: {}, evidence: [], insufficientEvidence: true },
    });
    expect(pack.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(pack.insufficientEvidence).toBe(true);
  });
});
