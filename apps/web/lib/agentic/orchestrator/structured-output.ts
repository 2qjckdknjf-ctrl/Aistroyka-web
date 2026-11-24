/**
 * Schema-constrained agent synthesis output. Never parse free markdown for actions.
 */

import { z } from "zod";

export const AgentProposedActionSchema = z.object({
  actionType: z.string().min(1).max(80),
  skillName: z.string().min(1).max(80),
  reason: z.string().max(500).default(""),
  expectedEffect: z.string().max(500).default(""),
  payload: z.record(z.unknown()).default({}),
});

export const AgentRiskItemSchema = z.object({
  title: z.string(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  why: z.string().optional(),
  evidenceId: z.string().optional(),
});

export const AgentBlockerItemSchema = z.object({
  title: z.string(),
  why: z.string().optional(),
  evidenceId: z.string().optional(),
});

export const AgentResponseSchema = z.object({
  summary: z.string(),
  health: z
    .object({
      score: z.number().min(0).max(100).optional(),
      band: z.enum(["GREEN", "AMBER", "RED"]).optional(),
    })
    .optional(),
  risks: z.array(AgentRiskItemSchema).default([]),
  blockers: z.array(AgentBlockerItemSchema).default([]),
  observations: z.array(z.string()).default([]),
  proposedActions: z.array(AgentProposedActionSchema).default([]),
  limitations: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

export type AgentStructuredResponse = z.infer<typeof AgentResponseSchema>;

export const AgentEvidenceRefSchema = z.object({
  evidenceId: z.string(),
  type: z.string(),
  sourceEntityType: z.string().optional(),
  sourceEntityId: z.string().optional(),
});

export const AgentPublicProposedActionSchema = z.object({
  actionType: z.string(),
  skillName: z.string().optional(),
  reason: z.string().optional(),
  expectedEffect: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  riskLevel: z.string().optional(),
  approvalRequired: z.boolean().optional(),
});

export const AgentPublicResponseSchema = z.object({
  schemaVersion: z.literal(1).optional(),
  runId: z.string().min(1),
  answer: z.string(),
  health: z
    .object({
      score: z.number().min(0).max(100).optional(),
      band: z.enum(["GREEN", "AMBER", "RED"]).optional(),
    })
    .optional(),
  risks: z.array(AgentRiskItemSchema).default([]),
  blockers: z.array(AgentBlockerItemSchema).default([]),
  evidence: z.array(AgentEvidenceRefSchema).default([]),
  proposedActions: z.array(AgentPublicProposedActionSchema).default([]),
  limitations: z.array(z.string()).default([]),
  confidence: z.string().optional(),
  runStatus: z
    .enum(["COMPLETED", "COMPLETED_WITH_LIMITATIONS", "INSUFFICIENT_EVIDENCE", "FAILED"])
    .optional(),
  synthesisSource: z.enum(["llm", "deterministic"]).optional(),
});

export type AgentPublicResponse = z.infer<typeof AgentPublicResponseSchema>;

export function parseAgentPublicResponse(value: unknown): AgentPublicResponse | null {
  const parsed = AgentPublicResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const BANNED_PAYLOAD_KEYS = new Set([
  "sql",
  "query",
  "url",
  "href",
  "eval",
  "shell",
  "command",
  "tenantId",
  "tenant_id",
  "projectId",
  "project_id",
]);

const BANNED_ACTION_SUBSTRINGS = ["http://", "https://", "select ", "insert ", "update ", "delete ", "drop "];

export function sanitizeProposedActions(
  actions: z.infer<typeof AgentProposedActionSchema>[],
  allowedSkillNames: string[]
): { accepted: z.infer<typeof AgentProposedActionSchema>[]; rejected: string[] } {
  const allow = new Set(allowedSkillNames);
  const accepted: z.infer<typeof AgentProposedActionSchema>[] = [];
  const rejected: string[] = [];

  for (const action of actions) {
    const blob = `${action.actionType} ${action.skillName} ${JSON.stringify(action.payload)}`.toLowerCase();
    if (BANNED_ACTION_SUBSTRINGS.some((s) => blob.includes(s))) {
      rejected.push("arbitrary_execution");
      continue;
    }
    if (!allow.has(action.skillName) && action.skillName !== "suggest") {
      rejected.push(`unknown_skill:${action.skillName}`);
      continue;
    }
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(action.payload ?? {})) {
      if (BANNED_PAYLOAD_KEYS.has(k)) continue;
      payload[k] = v;
    }
    accepted.push({ ...action, payload });
  }
  return { accepted, rejected };
}
