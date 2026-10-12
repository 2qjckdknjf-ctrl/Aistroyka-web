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
  });

  it("fails closed when the agent lacks the execution-mode capability", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: ["project:read"],
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("AGENT_UNAUTHORIZED");
      expect(decision.reason).toBe("agent_missing_mode_capability:mode:read");
    }
  });

  it("fails closed when the agent lacks a required domain capability", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: ["mode:read"],
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("AGENT_UNAUTHORIZED");
      expect(decision.reason).toBe("agent_missing_permission:project:read");
    }
  });

  it("fails closed when the user lacks the mapped RBAC permission", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx([]),
      agentPermissions: ["mode:read", "project:read"],
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("AGENT_UNAUTHORIZED");
      expect(decision.reason).toBe("user_missing_permission:project:read");
    }
  });

  it("default read-only style grants cannot authorize execute mode", () => {
    const executeSkill = skill({
      id: "prepare_change",
      name: "prepare_change",
      executionMode: "EXECUTE",
      requiresApproval: true,
    });

    const decision = resolveRuntimeAuthorization({
      skill: executeSkill,
      context: ctx(),
      agentPermissions: ["mode:read", "project:read"],
      operation,
      approval: approval(),
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("agent_missing_mode_capability:mode:execute");
    }
  });

  it("requires trusted approval for execute mode", () => {
    const executeSkill = skill({
      id: "prepare_change",
      name: "prepare_change",
      executionMode: "EXECUTE",
      requiredPermissions: ["project:read"],
      requiresApproval: true,
    });

    const decision = resolveRuntimeAuthorization({
      skill: executeSkill,
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("REQUIRE_APPROVAL");
  });

  it("accepts only scope-matching, non-expired, unconsumed approval evidence", () => {
    const executeSkill = skill({
      id: "prepare_change",
      name: "prepare_change",
      executionMode: "EXECUTE",
      requiredPermissions: ["project:read"],
      requiresApproval: true,
    });

    const decision = resolveRuntimeAuthorization({
      skill: executeSkill,
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      now: new Date("2026-09-08T01:00:00.000Z"),
      approval: approval(),
    });

    expect(decision.allowed).toBe(true);
    expect(decision.approvalId).toBe("approval-1");
    expect(decision.operationId).toBe("operation-1");
    expect(decision.inputHash).toBe("hash-1");
  });

  it("rejects approval evidence that was already consumed", () => {
    const executeSkill = skill({
      id: "prepare_change",
      name: "prepare_change",
      executionMode: "EXECUTE",
      requiresApproval: true,
    });

    const decision = resolveRuntimeAuthorization({
      skill: executeSkill,
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      approval: approval({ status: "CONSUMED", consumedAt: "2026-09-08T00:45:00.000Z" }),
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_not_claimable:consumed");
  });

  it("does not allow approval evidence from another project", () => {
    const executeSkill = skill({
      id: "prepare_change",
      name: "prepare_change",
      executionMode: "EXECUTE",
      requiresApproval: true,
    });

    const decision = resolveRuntimeAuthorization({
      skill: executeSkill,
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation,
      approval: approval({ projectId: "project-2" }),
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_project_mismatch");
  });

  it("does not allow approval bound to different validated input", () => {
    const executeSkill = skill({
      id: "prepare_change",
      name: "prepare_change",
      executionMode: "EXECUTE",
      requiresApproval: true,
    });

    const decision = resolveRuntimeAuthorization({
      skill: executeSkill,
      context: ctx(),
      agentPermissions: ["mode:execute", "project:read"],
      operation: { ...operation, inputHash: "hash-2" },
      approval: approval(),
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_input_mismatch");
  });
});
