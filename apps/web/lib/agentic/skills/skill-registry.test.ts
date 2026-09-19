import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { executeRegisteredSkill, SkillRegistry, selectSkillsFromAllowlist } from "./skill-registry";
import { AgentError } from "../errors";
import type { AgentSkill, SkillDefinition } from "./skill.types";
import type { AgentExecutionContext } from "../types";
import { RUNTIME_AUTHZ_POLICY_VERSION } from "../security/runtime-authorization";
import { hashRuntimeSkillInput } from "../security/runtime-operation";

function ctx(
  roles: AgentExecutionContext["roles"] = ["manager"],
  permissions: string[] = []
): AgentExecutionContext {
  return {
    tenantId: "t1",
    projectId: "p1",
    userId: "u1",
    actorType: "user",
    tenantRole: "member",
    projectRole: "manager",
    roles,
    permissions,
    requestId: "r1",
    traceId: "tr1",
    locale: "en",
    source: "WEB",
    timestamp: "2026-09-09T00:00:00.000Z",
  };
}

function fakeSkill(
  name: string,
  managerOnly = false,
  requiredPermissions: string[] = [],
  overrides: Partial<SkillDefinition> = {},
  execute = vi.fn(async () => ({ output: { ok: true }, evidence: [], insufficientEvidence: false }))
): AgentSkill {
  const definition: SkillDefinition = {
    id: name,
    name,
    version: "1",
    description: name,
    riskLevel: "LOW",
    executionMode: "READ",
    requiredPermissions,
    inputSchema: z.object({}).strict(),
    outputSchema: z.unknown(),
    requiresProject: true,
    requiresEvidence: false,
    requiresApproval: false,
    handler: name,
    managerOnly,
    ...overrides,
  };
  return {
    definition,
    validateInput: () => ({}),
    authorize: async () => undefined,
    execute,
  };
}

describe("SkillRegistry", () => {
  it("rejects unknown skills", () => {
    const registry = new SkillRegistry([fakeSkill("get_open_issues")]);
    expect(() => registry.require("drop_database")).toThrow(AgentError);
    try {
      registry.require("eval");
    } catch (e) {
      expect(e).toBeInstanceOf(AgentError);
      expect((e as AgentError).code).toBe("AGENT_UNKNOWN_SKILL");
    }
  });

  it("fails closed on duplicate skill names instead of silently overwriting", () => {
    expect(() => new SkillRegistry([fakeSkill("same_skill"), fakeSkill("same_skill")])).toThrow(AgentError);
  });

  it("rejects model-proposed unknown skills from allowlist helper", () => {
    const registry = new SkillRegistry([fakeSkill("get_open_issues")]);
    const { accepted, rejected } = selectSkillsFromAllowlist(
      registry,
      ["get_open_issues", "unknown_skill", "SELECT * FROM tenants"],
      ["get_open_issues"]
    );
    expect(accepted).toEqual(["get_open_issues"]);
    expect(rejected.length).toBe(2);
  });

  it("does not expose manager-only skills to workers", () => {
    const registry = new SkillRegistry([fakeSkill("get_open_issues"), fakeSkill("get_project_members", true)]);
    const allowed = registry.allowedReadSkills(ctx(["worker"]));
    expect(allowed).toContain("get_open_issues");
    expect(allowed).not.toContain("get_project_members");
  });

  it("denies execution when the user permission is missing", async () => {
    const registry = new SkillRegistry([fakeSkill("get_project_state", false, ["project:read"])]);

    await expect(executeRegisteredSkill(registry, ctx(["manager"], []), "get_project_state", {})).rejects.toMatchObject({
      code: "AGENT_UNAUTHORIZED",
    });
  });

  it("returns authorization trace and evidence pack for a governed execution", async () => {
    const registry = new SkillRegistry([fakeSkill("get_project_state", false, ["project:read"])]);

    const executed = await executeRegisteredSkill(
      registry,
      ctx(["manager"], ["read"]),
      "get_project_state",
      {}
    );

    expect(executed.authorization.status).toBe("ALLOW");
    expect(executed.evidencePack.authorization.policyVersion).toBe(RUNTIME_AUTHZ_POLICY_VERSION);
    expect(executed.evidencePack.skill.name).toBe("get_project_state");
  });

  it("never invokes an approval-gated handler without an atomic claim", async () => {
    const execute = vi.fn(async () => ({ output: { ok: true }, evidence: [], insufficientEvidence: false }));
    const governed = fakeSkill(
      "prepare_change",
      false,
      ["project:read"],
      { executionMode: "EXECUTE", requiresApproval: true },
      execute
    );
    const registry = new SkillRegistry([governed]);
    const inputHash = await hashRuntimeSkillInput({});

    await expect(
      executeRegisteredSkill(registry, ctx(["manager"], ["read"]), "prepare_change", {}, {
        agentPermissions: ["mode:execute", "project:read"],
        operationId: "operation-1",
        actionType: "update_project",
        approval: {
          approvalId: "approval-1",
          tenantId: "t1",
          projectId: "p1",
          skillName: "prepare_change",
          operationId: "operation-1",
          actionType: "update_project",
          inputHash,
          skillVersion: "1",
          status: "APPROVED",
          approvedBy: "owner-1",
          approvedAt: "2026-09-09T00:00:00.000Z",
        },
      })
    ).rejects.toMatchObject({ code: "AGENT_POLICY_DENIED", message: "approval_atomic_claim_required" });

    expect(execute).not.toHaveBeenCalled();
  });

  it("denies replay when the atomic claim reports an already-consumed approval", async () => {
    const execute = vi.fn(async () => ({ output: { ok: true }, evidence: [], insufficientEvidence: false }));
    const governed = fakeSkill(
      "prepare_change",
      false,
      ["project:read"],
      { executionMode: "EXECUTE", requiresApproval: true },
      execute
    );
    const registry = new SkillRegistry([governed]);
    const inputHash = await hashRuntimeSkillInput({});
    const claimApproval = vi.fn().mockResolvedValue({ claimed: false, reason: "approval_already_consumed" });

    await expect(
      executeRegisteredSkill(registry, ctx(["manager"], ["read"]), "prepare_change", {}, {
        agentPermissions: ["mode:execute", "project:read"],
        operationId: "operation-1",
        actionType: "update_project",
        approval: {
          approvalId: "approval-1",
          tenantId: "t1",
          projectId: "p1",
          skillName: "prepare_change",
          operationId: "operation-1",
          actionType: "update_project",
          inputHash,
          skillVersion: "1",
          status: "APPROVED",
          approvedBy: "owner-1",
          approvedAt: "2026-09-09T00:00:00.000Z",
        },
        claimApproval,
      })
    ).rejects.toMatchObject({ code: "AGENT_POLICY_DENIED", message: "approval_already_consumed" });

    expect(claimApproval).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
  });

  it("records consumed approval before invoking an approval-gated handler", async () => {
    const execute = vi.fn(async () => ({ output: { ok: true }, evidence: [], insufficientEvidence: false }));
    const governed = fakeSkill(
      "prepare_change",
      false,
      ["project:read"],
      { executionMode: "EXECUTE", requiresApproval: true },
      execute
    );
    const registry = new SkillRegistry([governed]);
    const inputHash = await hashRuntimeSkillInput({});
    const claimApproval = vi.fn().mockResolvedValue({
      claimed: true,
      consumedAt: "2026-09-09T00:01:00.000Z",
    });

    const executed = await executeRegisteredSkill(
      registry,
      ctx(["manager"], ["read"]),
      "prepare_change",
      {},
      {
        agentPermissions: ["mode:execute", "project:read"],
        operationId: "operation-1",
        actionType: "update_project",
        approval: {
          approvalId: "approval-1",
          tenantId: "t1",
          projectId: "p1",
          skillName: "prepare_change",
          operationId: "operation-1",
          actionType: "update_project",
          inputHash,
          skillVersion: "1",
          status: "APPROVED",
          approvedBy: "owner-1",
          approvedAt: "2026-09-09T00:00:00.000Z",
        },
        claimApproval,
      }
    );

    expect(claimApproval).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(executed.authorization.approvalConsumedAt).toBe("2026-09-09T00:01:00.000Z");
    expect(executed.evidencePack.authorization.approvalConsumedAt).toBe("2026-09-09T00:01:00.000Z");
  });
});
