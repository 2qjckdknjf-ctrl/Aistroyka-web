/**
 * Gold Memory types — sanitized retrieval examples only.
 */

export type GoldMemoryProvenance =
  | "expert_review"
  | "manager_preference_pair"
  | "human_authored";

export type GoldMemoryAudience =
  | "internal"
  | "owner"
  | "customer"
  | "worker"
  | "manager";

export const GOLD_MEMORY_PII_SCRUB_VERSION = "v1" as const;

export const COPILOT_GOLD_MEMORY_TASK_TYPE = "copilot_chat" as const;
export const COPILOT_GOLD_MEMORY_AUDIENCE = "manager" as const;

export interface GoldMemoryRow {
  id: string;
  tenant_id: string;
  task_type: string;
  audience: string;
  provenance: GoldMemoryProvenance;
  source_table: string;
  source_id: string;
  input_hash: string;
  scrubbed_input_json: Record<string, unknown>;
  scrubbed_gold_output_json: Record<string, unknown>;
  rationale: string | null;
  embedding_json: number[] | null;
  embedding_model: string | null;
  embedding_dim: number | null;
  pii_scrub_version: string;
  finance_guard_passed: boolean;
  consent_snapshot: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoldMemoryExample {
  scrubbedInput: Record<string, unknown>;
  scrubbedGoldOutput: Record<string, unknown>;
  provenance: GoldMemoryProvenance;
  rationale: string | null;
  similarityScore: number;
  taskType: string;
  audience: string;
}

export interface GoldMemoryCandidate {
  tenantId: string;
  taskType: string;
  audience: GoldMemoryAudience;
  provenance: GoldMemoryProvenance;
  sourceTable: string;
  sourceId: string;
  inputJson: Record<string, unknown>;
  goldOutputJson: Record<string, unknown>;
  rationale?: string | null;
  consent: boolean;
}

export interface GoldMemoryBuildStats {
  candidatesScanned: number;
  consentRejected: number;
  piiRejected: number;
  financeRejected: number;
  duplicateSkipped: number;
  embeddingSkipped: number;
  eligible: number;
  written: number;
}

export interface GoldMemoryRetrievalMeta {
  gold_memory_used: boolean;
  gold_memory_count: number;
  gold_memory_task_type: string | null;
  gold_memory_audience: string | null;
  gold_memory_trimmed: boolean;
  retrieval_failed: boolean;
  retrieval_latency_ms: number;
}

export interface GoldMemoryInsertRow {
  tenant_id: string;
  task_type: string;
  audience: string;
  provenance: GoldMemoryProvenance;
  source_table: string;
  source_id: string;
  input_hash: string;
  scrubbed_input_json: Record<string, unknown>;
  scrubbed_gold_output_json: Record<string, unknown>;
  rationale: string | null;
  embedding_json: number[] | null;
  embedding_model: string | null;
  embedding_dim: number | null;
  pii_scrub_version: string;
  finance_guard_passed: boolean;
  consent_snapshot: boolean;
}
