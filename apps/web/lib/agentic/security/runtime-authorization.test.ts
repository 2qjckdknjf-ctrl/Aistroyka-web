import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AgentExecutionContext } from "../types";
import type { SkillDefinition } from "../skills/skill.types";
import { resolveRuntimeAuthorization } from "./runtime-authorization";

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

describe("runtime authorization", () => {
  it("allows only when user, agent, skill and deterministic policy intersect", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: ["project:read"],
    });

    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe("ALLOW");
    expect(decision.effectivePermissions).toEqual(["project:read"]);
  });

  it("fails closed when the agent lacks a required capability", () => {
    const decision = resolveRuntimeAuthorization({
      skill: skill(),
      context: ctx(),
      agentPermissions: [],
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
      agentPermissions: ["project:read"],
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("AGENT_UNAUTHORIZED");
      expect(decision.reason).toBe("user_missing_permission:project:read");
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
      agentPermissions: ["project:read"],
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("REQUIRE_APPROVAL");
  });

  it("accepts only scope-matching, non-expired approval evidence", () => {
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
      agentPermissions: ["project:read"],
      now: new Date("2026-09-08T01:00:00.000Z"),
      approval: {
        approvalId: "approval-1",
        tenantId: "tenant-1",
        projectId: "project-1",
        skillName: "prepare_change",
        approvedBy: "owner-1",
        approvedAt: "2026-09-08T00:30:00.000Z",
        expiresAt: "2026-09-08T02:00:00.000Z",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.approvalId).toBe("approval-1");
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
      agentPermissions: ["project:read"],
      approval: {
        approvalId: "approval-foreign",
        tenantId: "tenant-1",
        projectId: "project-2",
        skillName: "prepare_change",
        approvedBy: "owner-1",
        approvedAt: "2026-09-08T00:30:00.000Z",
      },
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("approval_project_mismatch");
  });
});
