/**
 * AI Brain Phase C — Memory model types.
 * Scoped, typed memory. Assistive context, not canonical truth.
 */

export type AiMemoryType = "session" | "project_working" | "user_preference" | "learning_candidate";

export type AiMemoryScope = "tenant" | "project" | "user" | "session";

export type AiMemorySourceKind = "system_derived" | "human_confirmed" | "ai_suggested" | "ai_inferred" | "action_outcome";

export type AiMemoryConfidence = "high" | "medium" | "low";

export type AiMemoryStatus = "active" | "stale" | "superseded" | "expired" | "rejected";

export interface AiMemoryRecord {
  memoryId: string;
  tenantId: string;
  projectId: string | null;
  userId: string | null;
  memoryType: AiMemoryType;
  scope: AiMemoryScope;
  sourceKind: AiMemorySourceKind;
  sourceRef: string | null;
  title: string;
  body: unknown;
  factsUsed: string[];
  groundingRefs: string[];
  confidence: AiMemoryConfidence;
  expiresAt: string | null;
  status: AiMemoryStatus;
  supersededBy: string | null;
  createdAt: string;
  updatedAt: string;
}
