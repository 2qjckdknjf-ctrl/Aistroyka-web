/**
 * Gold Memory builder — consent → scrub → finance → embed → upsert.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeInputHash,
  createGoldMemoryEmbedder,
  type GoldMemoryEmbedder,
} from "./gold-memory.embedder";
import { guardGoldMemoryCandidate } from "./gold-memory.guard";
import { isAiGoldMemoryWriteEnabled } from "./gold-memory.flags";
import { findGoldMemoryBySource, upsertGoldMemoryRow, listExistingSourceIds } from "./gold-memory.repository";
import {
  GOLD_MEMORY_PII_SCRUB_VERSION,
  type GoldMemoryBuildStats,
  type GoldMemoryCandidate,
  type GoldMemoryInsertRow,
} from "./gold-memory.types";

export interface BuildGoldMemoryOptions {
  dryRun: boolean;
  embedder?: GoldMemoryEmbedder;
}

export interface BuildGoldMemoryResult {
  stats: GoldMemoryBuildStats;
  rows: GoldMemoryInsertRow[];
}

function emptyStats(): GoldMemoryBuildStats {
  return {
    candidatesScanned: 0,
    consentRejected: 0,
    piiRejected: 0,
    financeRejected: 0,
    duplicateSkipped: 0,
    embeddingSkipped: 0,
    eligible: 0,
    written: 0,
  };
}

function candidateToEmbeddingText(c: GoldMemoryCandidate, payload: {
  scrubbedInput: Record<string, unknown>;
  scrubbedGoldOutput: Record<string, unknown>;
}): string {
  try {
    return JSON.stringify({
      input: payload.scrubbedInput,
      output: payload.scrubbedGoldOutput,
      task: c.taskType,
    });
  } catch {
    return "";
  }
}

/** Process candidates through full guard pipeline. */
export async function buildGoldMemoryFromCandidates(
  supabase: SupabaseClient | null,
  candidates: GoldMemoryCandidate[],
  opts: BuildGoldMemoryOptions
): Promise<BuildGoldMemoryResult> {
  const stats = emptyStats();
  const rows: GoldMemoryInsertRow[] = [];
  const writeEnabled = isAiGoldMemoryWriteEnabled() && !opts.dryRun;
  const embedder = opts.embedder ?? createGoldMemoryEmbedder();

  const byTable = new Map<string, string[]>();
  for (const c of candidates) {
    const ids = byTable.get(c.sourceTable) ?? [];
    ids.push(c.sourceId);
    byTable.set(c.sourceTable, ids);
  }

  const existingIds = new Map<string, Set<string>>();
  if (supabase) {
    for (const [table, ids] of byTable) {
      existingIds.set(table, await listExistingSourceIds(supabase, table, ids));
    }
  }

  const processedSourceKeys = new Set<string>();

  for (const candidate of candidates) {
    stats.candidatesScanned++;

    const sourceKey = `${candidate.sourceTable}:${candidate.sourceId}`;
    if (processedSourceKeys.has(sourceKey)) {
      stats.duplicateSkipped++;
      continue;
    }

    const existing = existingIds.get(candidate.sourceTable);
    if (existing?.has(candidate.sourceId)) {
      stats.duplicateSkipped++;
      continue;
    }

    if (supabase) {
      const row = await findGoldMemoryBySource(
        supabase,
        candidate.sourceTable,
        candidate.sourceId
      );
      if (row) {
        stats.duplicateSkipped++;
        continue;
      }
    }

    processedSourceKeys.add(sourceKey);

    const guarded = guardGoldMemoryCandidate(candidate);
    if ("reject" in guarded) {
      if (guarded.reject.kind === "consent") stats.consentRejected++;
      else if (guarded.reject.kind === "pii") stats.piiRejected++;
      else stats.financeRejected++;
      continue;
    }

    const { payload } = guarded;
    const inputHash = computeInputHash(payload.scrubbedInput);

    let embeddingJson: number[] | null = null;
    let embeddingModel: string | null = null;
    let embeddingDim: number | null = null;

    if (writeEnabled && embedder.available) {
      const embedText = candidateToEmbeddingText(candidate, payload);
      const embedded = embedText ? await embedder.embedText(embedText) : null;
      if (embedded) {
        embeddingJson = embedded.vector;
        embeddingModel = embedded.model;
        embeddingDim = embedded.dim;
      } else {
        stats.embeddingSkipped++;
      }
    } else if (writeEnabled) {
      stats.embeddingSkipped++;
    }

    const insertRow: GoldMemoryInsertRow = {
      tenant_id: candidate.tenantId,
      task_type: candidate.taskType,
      audience: candidate.audience,
      provenance: candidate.provenance,
      source_table: candidate.sourceTable,
      source_id: candidate.sourceId,
      input_hash: inputHash,
      scrubbed_input_json: payload.scrubbedInput,
      scrubbed_gold_output_json: payload.scrubbedGoldOutput,
      rationale: candidate.rationale ?? null,
      embedding_json: embeddingJson,
      embedding_model: embeddingModel,
      embedding_dim: embeddingDim,
      pii_scrub_version: GOLD_MEMORY_PII_SCRUB_VERSION,
      finance_guard_passed: payload.financeGuardPassed,
      consent_snapshot: payload.consentSnapshot,
    };

    stats.eligible++;
    rows.push(insertRow);

    if (writeEnabled && supabase) {
      const result = await upsertGoldMemoryRow(supabase, insertRow);
      if (result.written) stats.written++;
    }
  }

  return { stats, rows };
}

/** Load expert review candidates from DB. */
export async function loadExpertReviewCandidates(
  supabase: SupabaseClient,
  opts: { tenantId?: string; limit?: number }
): Promise<GoldMemoryCandidate[]> {
  let query = supabase
    .from("ai_expert_reviews")
    .select("id, tenant_id, task_type, expert_conclusion, expert_rationale, corrected_output_json, verdict")
    .in("verdict", ["model_wrong", "model_partially_correct", "both_models_wrong"])
    .not("corrected_output_json", "is", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data: reviews } = await query;
  if (!reviews?.length) return [];

  const tenantIds = [...new Set(reviews.map((r) => r.tenant_id as string))];
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, ai_training_consent")
    .in("id", tenantIds);

  const consentMap = new Map(
    (tenants ?? []).map((t) => [t.id as string, t.ai_training_consent === true])
  );

  return reviews
    .filter((r) => r.corrected_output_json)
    .map((r) => ({
      tenantId: r.tenant_id as string,
      taskType: r.task_type as string,
      audience: "manager" as const,
      provenance: "expert_review" as const,
      sourceTable: "ai_expert_reviews",
      sourceId: r.id as string,
      inputJson: { prompt: r.expert_conclusion as string },
      goldOutputJson: r.corrected_output_json as Record<string, unknown>,
      rationale: (r.expert_rationale as string | null) ?? null,
      consent: consentMap.get(r.tenant_id as string) ?? false,
    }));
}

/** Load preference pair candidates from DB. */
export async function loadPreferencePairCandidates(
  supabase: SupabaseClient,
  opts: { tenantId?: string; limit?: number }
): Promise<GoldMemoryCandidate[]> {
  let query = supabase
    .from("ai_preference_pairs")
    .select("id, tenant_id, task_type, audience, input_json, chosen_json, low_value")
    .eq("low_value", false)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data: pairs } = await query;
  if (!pairs?.length) return [];

  const tenantIds = [...new Set(pairs.map((p) => p.tenant_id as string))];
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, ai_training_consent")
    .in("id", tenantIds);

  const consentMap = new Map(
    (tenants ?? []).map((t) => [t.id as string, t.ai_training_consent === true])
  );

  return pairs.map((p) => ({
    tenantId: p.tenant_id as string,
    taskType: p.task_type as string,
    audience: (p.audience as GoldMemoryCandidate["audience"]) || "internal",
    provenance: "manager_preference_pair" as const,
    sourceTable: "ai_preference_pairs",
    sourceId: p.id as string,
    inputJson: (p.input_json as Record<string, unknown>) ?? {},
    goldOutputJson: (p.chosen_json as Record<string, unknown>) ?? {},
    consent: consentMap.get(p.tenant_id as string) ?? false,
  }));
}
