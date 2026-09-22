/**
 * Agent evidence contract. Factual claims must cite supporting entities.
 * Lives under contracts/ because root .gitignore ignores any `evidence/` path.
 */

export const AGENT_EVIDENCE_TYPES = [
  "TASK",
  "ISSUE",
  "REPORT",
  "PHOTO",
  "VIDEO",
  "DOCUMENT",
  "INVOICE",
  "CONTRACT",
  "USER_INPUT",
  "DATABASE_STATE",
  "SYSTEM_EVENT",
] as const;

export type AgentEvidenceType = (typeof AGENT_EVIDENCE_TYPES)[number];

export interface AgentEvidence {
  evidenceId: string;
  type: AgentEvidenceType;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceUrl: string | null;
  storageObject: string | null;
  capturedAt: string;
  metadata: Record<string, unknown>;
}

export function toAgentEvidence(input: {
  type: AgentEvidenceType;
  sourceEntityType: string;
  sourceEntityId: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}): AgentEvidence {
  return {
    evidenceId: `${input.type}:${input.sourceEntityId}`,
    type: input.type,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    sourceUrl: null,
    storageObject: null,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
}

export function hasSupportingEvidence(evidence: AgentEvidence[]): boolean {
  return evidence.some((e) => e.sourceEntityId.length > 0 && e.type !== "USER_INPUT");
}
