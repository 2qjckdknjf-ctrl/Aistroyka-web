import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AgentExecutionContext } from "../types";
import type { SkillDefinition, SkillResult } from "../skills/skill.types";
import type { RuntimeAuthorizationAllowed } from "../security/runtime-authorization";
import {
  buildAgentExecutionEvidencePack,
  validateAgentExecutionEvidencePack,
  type AgentExecutionEvidencePack,
} from "./execution-evidence-pack";
import { toAgentEvidence } from "./evidence.types";

function skill(requiresEvidence = true): SkillDefinition {
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
  };
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
    policyVersion: "agentic-runtime-authz-v1",
    effectivePermissions: ["project:read"],
    approvalRequired: false,
    approvalId: null,
    level: "LEVEL_0_READ",
    ...overrides,
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

    expect(pack.outcome).toBe("COMPLETED");
    expect(pack.authorization.policyVersion).toBe("agentic-runtime-authz-v1");
    expect(pack.evidence).toHaveLength(1);
  });

  it("rejects a completed evidence-required execution without supporting evidence", () => {
    const definition = skill();
    const pack: AgentExecutionEvidencePack = {
      schemaVersion: 1,
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
        policyVersion: "agentic-runtime-authz-v1",
        effectivePermissions: ["project:read"],
        approvalRequired: false,
        approvalId: null,
        level: "LEVEL_0_READ",
      },
      outcome: "COMPLETED",
      evidence: [],
      insufficientEvidence: false,
      createdAt: "2026-09-08T00:01:00.000Z",
    };

    expect(validateAgentExecutionEvidencePack(pack, definition)).toContain("missing_supporting_evidence");
  });

  it("rejects a governed completion when approval was required but not evidenced", () => {
    const definition = skill(false);
    const result: SkillResult = { output: {}, evidence: [], insufficientEvidence: false };

    expect(() =>
      buildAgentExecutionEvidencePack({
        context: ctx(),
        skill: definition,
        authorization: authorization({ approvalRequired: true, approvalId: null }),
        result,
      })
    ).toThrow();
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
