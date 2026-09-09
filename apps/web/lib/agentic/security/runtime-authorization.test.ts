import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AgentExecutionContext } from "../types";
import type { SkillDefinition } from "../skills/skill.types";
import {
  RUNTIME_AUTHZ_POLICY_VERSION,
  resolveRuntimeAuthorization,
  type RuntimeApproval,
  type RuntimeOperationBinding,
} from "./runtime-authorization";

function skill(overrides: Partial<SkillDefinition> = {}): SkillDefinition {
  return {
    id: "get_project_state",
    name: "get_project_state",
    version: "1",
    description: "test",
    riskLevel: "LOW",
    executionMode: "READ",
    requiredPermissions: ["project:read"],
    inputSchema: z.object({}),
    outputSchema: z.unknown(),
    requiresProject: true,
    requiresEvidence: false,
    requiresApproval: false,
    handler: "get_project_state",
    ...overrides,
  };
}

function ctx(permissions: string[] = ["read"]): AgentExecutionContext {
  return {
    tenantId: "tenant-1",
    projectId: "project-1",
    userId: "user-1",
    actorType: "user",
    tenantRole: "member",
    projectRole: "manager",
    roles: ["manager"],
    permissions,
    requestId: "request-1",
    traceId: "trace-1",
    locale: "en",
    source: "WEB",
    timestamp: "2026-09-08T00:00:00.000Z",
  };
}

const operation: RuntimeOperationBinding = {
  operationId: "operation-1",
  actionType: "update_project",
  inputHash: "hash-1",
  skillVersion: "1",
};

function approval(overrides: Partial<RuntimeApproval> = {}): RuntimeApproval {
  return {
    approvalId: "approval-1",
    tenantId: "tenant-1",
    projectId: "project-1",
    skillName: "prepare_change",
    operationId: operation.operationId,
    actionType: operation.actionType,
    inputHash: operation.inputHash,
    skillVersion: operation.skillVersion,
    status: "APPROVED",
    approvedBy: "owner-1",
    approvedAt: "2026-09-08T00:30:00.000Z",
    expiresAt: "2026-09-08T02:00:00.000Z",
    consumedAt: null,
    ...overrides,
  };
}

function executeSkill(): SkillDefinition {
  return skill({
    id: "prepare_change",
    name: "prepare_change",
    executionMode: "EXECUTE",
    requiredPermissions: ["project:read"],
    requiresApproval: true,
  });
}

describe("runtime authorization", () => {
  it("allows only when user, agent, skill and deterministic policy intersect", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: ["mode:read", "project:read"],
    });

    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe("ALLOW");
    expect(decision.policyVersion).toBe(RUNTIME_AUTHZ_POLICY_VERSION);
    expect(decision.effectivePermissions).toEqual(["mode:read", "project:read"]);
    expect(decision.actionType).toBeNull();
  });

  it("fails closed when the agent lacks the execution-mode capability", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: ["project:read"],
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("agent_missing_mode_capability:mode:read");
  });

  it("fails closed when the agent lacks a required domain capability", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: ["mode:read"],
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("agent_missing_permission:project:read");
  });

  it("fails closed when the user lacks the mapped RBAC permission", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx([]),
      agentPermissions: ["mode:read", "project:read"],
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("user_missing_permission:project:read");
  });

  it("default read-only style grants cannot authorize execute mode", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:read", "project:read"],
      operation,
      approval: approval(),
      now: new Date("2026-09-08T01:00:00.000Z"),
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("agent_missing_mode_capability:mode:execute");
  });

  it("requires trusted approval for execute mode", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("REQUIRE_APPROVAL");
    expect(decision.actionType).toBe("update_project");
  });

  it("retains the human approver and canonical grant chronology", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation: { ...operation, actionType: " Update_Project " },
      actionType: "UPDATE_PROJECT",
      now: new Date("2026-09-08T01:00:00.000Z"),
      approval: approval({ actionType: "update_PROJECT" }),
    });

    expect(decision.allowed).toBe(true);
    expect(decision.approvalId).toBe("approval-1");
    expect(decision.approvalApprovedBy).toBe("owner-1");
    expect(decision.approvalApprovedAt).toBe("2026-09-08T00:30:00.000Z");
    expect(decision.approvalExpiresAt).toBe("2026-09-08T02:00:00.000Z");
    expect(decision.operationId).toBe("operation-1");
    expect(decision.actionType).toBe("update_project");
    expect(decision.inputHash).toBe("hash-1");
  });

  it("rejects restricted action types case-insensitively", () => {
    const restrictedOperation = { ...operation, actionType: " PaYmEnT " };
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation: restrictedOperation,
      approval: approval({ actionType: "PAYMENT" }),
      now: new Date("2026-09-08T01:00:00.000Z"),
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("AGENT_RESTRICTED_ACTION");
      expect(decision.reason).toBe("restricted:payment");
    }
  });

  it("fails closed on malformed approval expiry timestamps", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      now: new Date("2026-09-08T01:00:00.000Z"),
      approval: approval({ expiresAt: "not-a-timestamp" }),
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_expiry_invalid");
  });

  it("fails closed on malformed, future, or empty human approval evidence", () => {
    const base = {
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"] as const,
      operation,
      now: new Date("2026-09-08T01:00:00.000Z"),
    };

    const malformed = resolveRuntimeAuthorization({ ...base, approval: approval({ approvedAt: "bad" }) });
    expect(malformed.allowed).toBe(false);
    if (!malformed.allowed) expect(malformed.reason).toBe("approval_approved_at_invalid");

    const future = resolveRuntimeAuthorization({
      ...base,
      approval: approval({ approvedAt: "2026-09-08T01:00:01.000Z" }),
    });
    expect(future.allowed).toBe(false);
    if (!future.allowed) expect(future.reason).toBe("approval_approved_at_future");

    const noApprover = resolveRuntimeAuthorization({ ...base, approval: approval({ approvedBy: "  " }) });
    expect(noApprover.allowed).toBe(false);
    if (!noApprover.allowed) expect(noApprover.reason).toBe("approval_approver_invalid");
  });

  it("rejects an approval whose grant time is not before expiry", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      now: new Date("2026-09-08T00:45:00.000Z"),
      approval: approval({
        approvedAt: "2026-09-08T00:40:00.000Z",
        expiresAt: "2026-09-08T00:40:00.000Z",
      }),
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_grant_chronology_invalid");
  });

  it("rejects approval evidence that was already consumed", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      approval: approval({ status: "CONSUMED", consumedAt: "2026-09-08T00:45:00.000Z" }),
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_not_claimable:consumed");
  });

  it("does not allow approval evidence from another project", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      approval: approval({ projectId: "project-2" }),
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_project_mismatch");
  });

  it("does not allow approval bound to different validated input", () => {
    const decision = resolveRuntimeAuthorization({
      skill: executeSkill(),
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation: { ...operation, inputHash: "hash-2" },
      approval: approval(),
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_input_mismatch");
  });
});
