/**
 * Gold Memory retrieval — tenant/audience filtered, fail-safe.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cosineSimilarity,
  createGoldMemoryEmbedder,
  type GoldMemoryEmbedder,
} from "./gold-memory.embedder";
import { isAiGoldMemoryReadEnabled } from "./gold-memory.flags";
import { listActiveGoldMemoryForTenant } from "./gold-memory.repository";
import type { GoldMemoryExample, GoldMemoryRow } from "./gold-memory.types";

export const DEFAULT_GOLD_MEMORY_LIMIT = 3;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.72;

export interface RetrieveGoldMemoryInput {
  tenantId: string;
  taskType: string;
  audience: string;
  sanitizedInputJson?: Record<string, unknown>;
  sanitizedText?: string;
  limit?: number;
  similarityThreshold?: number;
  requestId?: string;
  embedder?: GoldMemoryEmbedder;
}

function rowToExample(row: GoldMemoryRow, score: number): GoldMemoryExample {
  return {
    scrubbedInput: row.scrubbed_input_json,
    scrubbedGoldOutput: row.scrubbed_gold_output_json,
    provenance: row.provenance,
    rationale: row.rationale,
    similarityScore: score,
    taskType: row.task_type,
    audience: row.audience,
  };
}

function isOwnerSafeRow(row: GoldMemoryRow, audience: string): boolean {
  if (audience !== "owner" && audience !== "customer") return true;
  return row.finance_guard_passed === true;
}

function inputToQueryText(input: RetrieveGoldMemoryInput): string {
  if (input.sanitizedText?.trim()) return input.sanitizedText.trim();
  if (input.sanitizedInputJson) {
    try {
      return JSON.stringify(input.sanitizedInputJson);
    } catch {
      return "";
    }
  }
  return "";
}

/** Retrieve top similar gold examples. Returns [] on any failure or when flags off. */
export async function retrieveGoldMemoryExamples(
  supabase: SupabaseClient,
  input: RetrieveGoldMemoryInput
): Promise<GoldMemoryExample[]> {
  if (!isAiGoldMemoryReadEnabled()) return [];

  try {
    const limit = input.limit ?? DEFAULT_GOLD_MEMORY_LIMIT;
    const threshold = input.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
    const rows = await listActiveGoldMemoryForTenant(supabase, {
      tenantId: input.tenantId,
      taskType: input.taskType,
      audience: input.audience,
      limit: 50,
    });

    const safeRows = rows.filter((r) => isOwnerSafeRow(r, input.audience));
    if (safeRows.length === 0) return [];

    const embedder = input.embedder ?? createGoldMemoryEmbedder();
    const queryText = inputToQueryText(input);

    if (!embedder.available || !queryText) {
      return [];
    }

    const queryEmbed = await embedder.embedText(queryText);
    if (!queryEmbed) return [];

    const scored: GoldMemoryExample[] = [];
    for (const row of safeRows) {
      const vec = row.embedding_json;
      if (!Array.isArray(vec) || vec.length === 0) continue;
      const score = cosineSimilarity(queryEmbed.vector, vec);
      if (score >= threshold) {
        scored.push(rowToExample(row, score));
      }
    }

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    return scored.slice(0, limit);
  } catch {
    return [];
  }
}
