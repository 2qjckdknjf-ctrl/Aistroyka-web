import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SkillRegistry, selectSkillsFromAllowlist } from "./skill-registry";
import { AgentError } from "../errors";
import type { AgentSkill } from "./skill.types";
import type { AgentExecutionContext } from "../types";

function ctx(roles: AgentExecutionContext["roles"] = ["manager"]): AgentExecutionContext {
  return {
    tenantId: "t1",
    projectId: "p1",
    userId: "u1",
    actorType: "user",
    roles,
    permissions: [],
    requestId: "r1",
    traceId: "tr1",
    locale: "en",
    source: "WEB",
    timestamp: new Date().toISOString(),
  };
}

function fakeSkill(name: string, managerOnly = false): AgentSkill {
  const definition = {
    id: name,
    name,
    version: "1",
    description: name,
    riskLevel: "LOW" as const,
    executionMode: "READ" as const,
    requiredPermissions: [],
    inputSchema: z.object({}).strict(),
    outputSchema: z.unknown(),
    requiresProject: true,
    requiresEvidence: false,
    requiresApproval: false,
    handler: name,
    managerOnly,
  };
  return {
    definition,
    validateInput: () => ({}),
    authorize: async () => undefined,
    execute: async () => ({ output: { ok: true }, evidence: [], insufficientEvidence: false }),
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
});
