import { describe, expect, it } from "vitest";
import { resolveAgentActionPolicy } from "./policy-resolver";
import { isRestrictedActionType } from "./policy-levels";
import type { SkillDefinition } from "../skills/skill.types";
import type { AgentExecutionContext } from "../types";
import { z } from "zod";

const readSkill: SkillDefinition = {
  id: "get_open_issues",
  name: "get_open_issues",
  version: "1",
  description: "test",
  riskLevel: "LOW",
  executionMode: "READ",
  requiredPermissions: [],
  inputSchema: z.object({}),
  outputSchema: z.unknown(),
  requiresProject: true,
  requiresEvidence: false,
  requiresApproval: false,
  handler: "get_open_issues",
};

const managerSkill: SkillDefinition = { ...readSkill, name: "get_project_members", managerOnly: true };

function ctx(roles: AgentExecutionContext["roles"]): AgentExecutionContext {
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

describe("policy resolver", () => {
  it("allows read skills for workers", () => {
    const d = resolveAgentActionPolicy({ skill: readSkill, context: ctx(["worker"]) });
    expect(d.allowed).toBe(true);
  });

  it("denies manager-only skill for workers", () => {
    const d = resolveAgentActionPolicy({ skill: managerSkill, context: ctx(["worker"]) });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("AGENT_SKILL_NOT_ALLOWED");
  });

  it("rejects restricted actions", () => {
    const d = resolveAgentActionPolicy({
      skill: readSkill,
      context: ctx(["manager"]),
      actionType: "payment",
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("AGENT_RESTRICTED_ACTION");
  });

  it("blocks mode escalation to EXECUTE", () => {
    const d = resolveAgentActionPolicy({
      skill: readSkill,
      context: ctx(["manager"]),
      requestedMode: "EXECUTE",
    });
    expect(d.allowed).toBe(false);
  });

  it("classifies restricted action types", () => {
    expect(isRestrictedActionType("payment")).toBe(true);
    expect(isRestrictedActionType("project_delete")).toBe(true);
    expect(isRestrictedActionType("get_open_issues")).toBe(false);
  });
});
