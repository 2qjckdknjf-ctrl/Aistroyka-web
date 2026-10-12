import { describe, expect, it } from "vitest";
import { deriveAgentCapabilityRoles } from "./context";
import { SkillRegistry } from "./skills/skill-registry";
import { z } from "zod";
import type { AgentSkill } from "./skills/skill.types";
import type { AgentExecutionContext } from "./types";

function membersSkill(): AgentSkill {
  return {
    definition: {
      id: "get_project_members",
      name: "get_project_members",
      version: "1",
      description: "members",
      riskLevel: "LOW",
      executionMode: "READ",
      requiredPermissions: [],
      inputSchema: z.object({}),
      outputSchema: z.unknown(),
      requiresProject: true,
      requiresEvidence: false,
      requiresApproval: false,
      handler: "get_project_members",
      managerOnly: true,
    },
    validateInput: () => ({}),
    authorize: async () => undefined,
    execute: async () => ({ output: {}, evidence: [], insufficientEvidence: false }),
  };
}

function ctxFromRoles(roles: AgentExecutionContext["roles"]): AgentExecutionContext {
  return {
    tenantId: "t1",
    projectId: "p1",
    userId: "u1",
    actorType: "user",
    tenantRole: "member",
    projectRole: "worker",
    roles,
    permissions: [],
    requestId: "r1",
    traceId: "tr1",
    locale: "en",
    source: "WEB",
    timestamp: new Date().toISOString(),
  };
}

describe("deriveAgentCapabilityRoles", () => {
  it("does not escalate tenant member + project worker to manager", () => {
    const roles = deriveAgentCapabilityRoles({ tenantRole: "member", projectRole: "worker" });
    expect(roles).toEqual(["worker"]);
    expect(roles).not.toContain("manager");
    const registry = new SkillRegistry([membersSkill()]);
    expect(registry.allowedReadSkills(ctxFromRoles(roles))).not.toContain("get_project_members");
  });

  it("gives tenant admin the admin capability", () => {
    expect(deriveAgentCapabilityRoles({ tenantRole: "admin", projectRole: "member" })).toEqual(["admin"]);
  });

  it("gives project manager the manager capability", () => {
    expect(deriveAgentCapabilityRoles({ tenantRole: "member", projectRole: "manager" })).toEqual(["manager"]);
  });
});
