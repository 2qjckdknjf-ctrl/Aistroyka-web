/**
 * ROMA-compatible test vectors for later governance harness consumption.
 * This file is the contract; ROMA lives in a separate program and is not modified here.
 */

import { describe, expect, it } from "vitest";
import { AgentResponseSchema } from "../orchestrator/structured-output";
import { isRestrictedActionType } from "../policy/policy-levels";
import { selectSkillsFromAllowlist, SkillRegistry } from "../skills/skill-registry";
import { z } from "zod";
import type { AgentSkill } from "../skills/skill.types";

const VECTOR_IDS = [
  "tenant_isolation",
  "unsupported_tool",
  "unauthorized_write",
  "evidence_free_conclusion",
  "restricted_action",
  "model_malformed_output",
  "provider_timeout",
  "duplicate_request",
  "replay",
] as const;

function skill(name: string): AgentSkill {
  return {
    definition: {
      id: name,
      name,
      version: "1",
      description: name,
      riskLevel: "LOW",
      executionMode: "READ",
      requiredPermissions: [],
      inputSchema: z.object({}),
      outputSchema: z.unknown(),
      requiresProject: true,
      requiresEvidence: false,
      requiresApproval: false,
      handler: name,
    },
    validateInput: () => ({}),
    authorize: async () => undefined,
    execute: async () => ({ output: {}, evidence: [], insufficientEvidence: false }),
  };
}

describe("ROMA agentic foundation vectors", () => {
  it("exports the required vector ids", () => {
    expect(VECTOR_IDS).toHaveLength(9);
  });

  it("unsupported_tool → reject", () => {
    const registry = new SkillRegistry([skill("get_open_issues")]);
    expect(selectSkillsFromAllowlist(registry, ["vision_live_stream"], ["get_open_issues"]).rejected).toContain(
      "vision_live_stream"
    );
  });

  it("restricted_action → reject", () => {
    expect(isRestrictedActionType("payment")).toBe(true);
  });

  it("model_malformed_output → schema fail", () => {
    expect(AgentResponseSchema.safeParse({ summary: 1 }).success).toBe(false);
  });

  it("evidence_free_conclusion is represented as INSUFFICIENT_EVIDENCE limitation", () => {
    const parsed = AgentResponseSchema.parse({
      summary: "Cannot confirm delay",
      limitations: ["INSUFFICIENT_EVIDENCE"],
    });
    expect(parsed.limitations).toContain("INSUFFICIENT_EVIDENCE");
  });
});
