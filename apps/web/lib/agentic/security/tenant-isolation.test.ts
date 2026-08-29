/**
 * Security vectors for Agentic Foundation (also a ROMA-compatible contract).
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SkillRegistry, executeRegisteredSkill, selectSkillsFromAllowlist } from "../skills/skill-registry";
import { resolveAgentActionPolicy } from "../policy/policy-resolver";
import { sanitizeProposedActions } from "../orchestrator/structured-output";
import { isRestrictedActionType } from "../policy/policy-levels";
import { AgentError } from "../errors";
import type { AgentSkill } from "../skills/skill.types";
import type { AgentExecutionContext } from "../types";

function ctx(over: Partial<AgentExecutionContext> = {}): AgentExecutionContext {
  return {
    tenantId: "tenant-a",
    projectId: "project-a",
    userId: "user-a",
    actorType: "user",
    roles: ["manager"],
    permissions: [],
    requestId: "r1",
    traceId: "tr1",
    locale: "en",
    source: "WEB",
    timestamp: new Date().toISOString(),
    ...over,
  };
}

function skill(name: string, managerOnly = false): AgentSkill {
  return {
    definition: {
      id: name,
      name,
      version: "1",
      description: name,
      riskLevel: "LOW",
      executionMode: "READ",
      requiredPermissions: [],
      inputSchema: z.object({}).strict(),
      outputSchema: z.unknown(),
      requiresProject: true,
      requiresEvidence: false,
      requiresApproval: false,
      handler: name,
      managerOnly,
    },
    validateInput: () => ({}),
    authorize: async (c) => {
      if (c.tenantId === "tenant-b") {
        throw new AgentError("AGENT_PROJECT_ACCESS_DENIED", "cross_tenant", 403);
      }
    },
    execute: async (c) => ({
      output: { tenantId: c.tenantId, projectId: c.projectId },
      evidence: [],
      insufficientEvidence: false,
    }),
  };
}

describe("agentic security vectors", () => {
  it("tenant isolation: skill context tenant cannot be swapped by the model", async () => {
    const registry = new SkillRegistry([skill("get_project_state")]);
    const result = await executeRegisteredSkill(registry, ctx(), "get_project_state", {
      tenantId: "tenant-b",
    });
    expect((result.result.output as { tenantId: string }).tenantId).toBe("tenant-a");
  });

  it("project isolation: context project is used, not input projectId", async () => {
    const registry = new SkillRegistry([skill("get_project_state")]);
    const result = await executeRegisteredSkill(registry, ctx(), "get_project_state", {
      projectId: "project-b",
    });
    expect((result.result.output as { projectId: string }).projectId).toBe("project-a");
  });

  it("unknown skill is rejected", () => {
    const registry = new SkillRegistry([skill("get_project_state")]);
    const { rejected } = selectSkillsFromAllowlist(registry, ["rm_rf"], ["get_project_state"]);
    expect(rejected).toContain("rm_rf");
  });

  it("restricted write is denied", () => {
    expect(isRestrictedActionType("tenant_delete")).toBe(true);
    const d = resolveAgentActionPolicy({
      skill: skill("get_project_state").definition,
      context: ctx(),
      actionType: "tenant_delete",
    });
    expect(d.allowed).toBe(false);
  });

  it("malformed SQL payload is rejected", () => {
    const { accepted } = sanitizeProposedActions(
      [
        {
          actionType: "query",
          skillName: "suggest",
          reason: "",
          expectedEffect: "",
          payload: { sql: "select 1" },
        },
      ],
      ["suggest"]
    );
    expect(accepted).toHaveLength(0);
  });

  it("user outside project scope fails closed when tenant missing", () => {
    const d = resolveAgentActionPolicy({
      skill: skill("get_project_state").definition,
      context: ctx({ tenantId: "", projectId: "", userId: "x" }),
    });
    expect(d.allowed).toBe(false);
  });
});
