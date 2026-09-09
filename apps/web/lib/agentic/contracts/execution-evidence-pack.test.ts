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

function ctx(): AgentExecutionContext {
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
    approvalConsumedAt: null,
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
    approvalConsumedAt: "2026-09-08T00:00:30.000Z",
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
    executionId: "e1",
    requestId: "r1",
    traceId: "t1",
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
      approvalConsumedAt: null,
      level: "LEVEL_0_READ",
      operationId: null,
      actionType: null,
      inputHash: null,
    },
    outcome: "COMPLETED",
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
    expect(pack.authorization.policyVersion).toBe(RUNTIME_AUTHZ_POLICY_VERSION);
    expect(pack.evidence).toHaveLength(1);
  });

  it("rejects a forged completed evidence-required pack without supporting evidence", () => {
    const definition = skill();
    const pack = completedReadPack();
    pack.evidence = [];

    expect(validateAgentExecutionEvidencePack(pack, definition)).toContain("missing_supporting_evidence");
  });

  it("rejects a persisted pack whose actual authorization decision is not ALLOW", () => {
    const definition = skill();
    const forged = completedReadPack();
    forged.authorization.status = "DENY";

    expect(validateAgentExecutionEvidencePack(forged, definition)).toContain("authorization_not_allowed");
  });

  it("rejects a persisted pack missing the skill execution-mode capability", () => {
    const definition = skill();
    const forged = completedReadPack();
    forged.authorization.effectivePermissions = ["project:read"];

    expect(validateAgentExecutionEvidencePack(forged, definition)).toContain(
      "missing_effective_mode_capability:mode:read"
    );
  });

  it("rejects a persisted pack missing a trusted skill domain permission", () => {
    const definition = skill();
    const forged = completedReadPack();
    forged.authorization.effectivePermissions = ["mode:read"];

    expect(validateAgentExecutionEvidencePack(forged, definition)).toContain(
      "missing_effective_permission:project:read"
    );
  });

  it("rejects a governed completion when approval was required but not evidenced", () => {
    const definition = approvalSkill();
    const result: SkillResult = { output: {}, evidence: [], insufficientEvidence: false };

    expect(() =>
      buildAgentExecutionEvidencePack({
        context: ctx(),
        skill: definition,
        authorization: approvedAuthorization({
          approvalId: null,
          approvalConsumedAt: null,
        }),
        result,
      })
    ).toThrow();
  });

  it("rejects a governed completion when approval was not atomically consumed", () => {
    const definition = approvalSkill();
    const result: SkillResult = { output: {}, evidence: [], insufficientEvidence: false };

    expect(() =>
      buildAgentExecutionEvidencePack({
        context: ctx(),
        skill: definition,
        authorization: approvedAuthorization({ approvalConsumedAt: null }),
        result,
      })
    ).toThrow();
  });

  it("records immutable approved operation, action type, input hash and consumption timestamp", () => {
    const definition = approvalSkill();
    const result: SkillResult = { output: {}, evidence: [], insufficientEvidence: false };

    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result,
    });

    expect(pack.skill.executionMode).toBe("EXECUTE");
    expect(pack.authorization.approvalId).toBe("approval-1");
    expect(pack.authorization.approvalConsumedAt).toBe("2026-09-08T00:00:30.000Z");
    expect(pack.authorization.operationId).toBe("operation-1");
    expect(pack.authorization.actionType).toBe("update_project");
    expect(pack.authorization.inputHash).toBe("hash-1");
  });

  it("rejects an approval-gated pack that omits the approved action type", () => {
    const definition = approvalSkill();
    const valid = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
    });
    const forged: AgentExecutionEvidencePack = {
      ...valid,
      authorization: { ...valid.authorization, actionType: null },
    };

    expect(validateAgentExecutionEvidencePack(forged, definition)).toContain("missing_approved_action_type");
  });

  it("degrades an approved evidence-required result to insufficient evidence instead of throwing post-execution", () => {
    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: approvalSkill(true),
      authorization: approvedAuthorization(),
      result: { output: { mutationCommitted: true }, evidence: [], insufficientEvidence: false },
    });

    expect(pack.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(pack.insufficientEvidence).toBe(true);
    expect(pack.evidence).toEqual([]);
  });

  it("rejects a pack that falsely declares approval unnecessary for an executable skill", () => {
    const definition = approvalSkill();
    const valid = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: definition,
      authorization: approvedAuthorization(),
      result: { output: {}, evidence: [], insufficientEvidence: false },
    });
    const forged: AgentExecutionEvidencePack = {
      ...valid,
      authorization: {
        ...valid.authorization,
        approvalRequired: false,
        approvalId: null,
        approvalConsumedAt: null,
        operationId: null,
        actionType: null,
        inputHash: null,
      },
    };

    const errors = validateAgentExecutionEvidencePack(forged, definition);
    expect(errors).toContain("approval_requirement_mismatch");
    expect(errors).toContain("missing_approval_evidence");
    expect(errors).toContain("missing_approved_operation");
    expect(errors).toContain("missing_approved_action_type");
    expect(errors).toContain("missing_approved_input_hash");
    expect(errors).toContain("approval_not_consumed");
  });

  it("allows an explicit insufficient-evidence outcome without pretending success", () => {
    const result: SkillResult = { output: {}, evidence: [], insufficientEvidence: true };
    const pack = buildAgentExecutionEvidencePack({
      context: ctx(),
      skill: skill(),
      authorization: authorization(),
      result,
    });

    expect(pack.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(pack.insufficientEvidence).toBe(true);
  });
});
