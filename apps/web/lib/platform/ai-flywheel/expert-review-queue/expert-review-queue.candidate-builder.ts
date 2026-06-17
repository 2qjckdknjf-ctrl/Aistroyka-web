/**
 * Expert Review Queue candidate generation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { guardQueueCandidate } from "./expert-review-queue.guard";
import { isExpertReviewWriteEnabled } from "./expert-review-queue.flags";
import {
  findQueueBySource,
  insertQueueItem,
  listExistingQueueSourceIds,
} from "./expert-review-queue.repository";
import type {
  ExpertReviewQueueBuildStats,
  ExpertReviewQueueCandidate,
} from "./expert-review-queue.types";

const LOW_SCORE_THRESHOLD = 2;

function emptyStats(): ExpertReviewQueueBuildStats {
  return {
    candidatesScanned: 0,
    piiRejected: 0,
    financeRejected: 0,
    duplicateSkipped: 0,
    eligible: 0,
    written: 0,
  };
}

export async function buildExpertReviewQueueFromCandidates(
  supabase: SupabaseClient | null,
  candidates: ExpertReviewQueueCandidate[],
  opts: { dryRun: boolean }
): Promise<{ stats: ExpertReviewQueueBuildStats }> {
  const stats = emptyStats();
  const writeEnabled = isExpertReviewWriteEnabled() && !opts.dryRun && !!supabase;
  const processed = new Set<string>();

  const byTable = new Map<string, string[]>();
  for (const c of candidates) {
    const ids = byTable.get(c.sourceTable) ?? [];
    ids.push(c.sourceId);
    byTable.set(c.sourceTable, ids);
  }

  const existingIds = new Map<string, Set<string>>();
  if (supabase) {
    for (const [table, ids] of byTable) {
      existingIds.set(table, await listExistingQueueSourceIds(supabase, table, ids));
    }
  }

  for (const candidate of candidates) {
    stats.candidatesScanned++;
    const key = `${candidate.sourceTable}:${candidate.sourceId}`;
    if (processed.has(key)) {
      stats.duplicateSkipped++;
      continue;
    }

    if (existingIds.get(candidate.sourceTable)?.has(candidate.sourceId)) {
      stats.duplicateSkipped++;
      continue;
    }

    if (supabase) {
      const existing = await findQueueBySource(
        supabase,
        candidate.sourceTable,
        candidate.sourceId
      );
      if (existing) {
        stats.duplicateSkipped++;
        continue;
      }
    }

    processed.add(key);

    const guarded = guardQueueCandidate(candidate);
    if ("reject" in guarded) {
      if (guarded.reject.kind === "pii") stats.piiRejected++;
      else stats.financeRejected++;
      continue;
    }

    stats.eligible++;

    if (writeEnabled && supabase) {
      const result = await insertQueueItem(supabase, {
        ...candidate,
        inputJson: guarded.payload.inputJson,
        modelOutputJson: guarded.payload.modelOutputJson,
      });
      if (result.written) stats.written++;
    }
  }

  return { stats };
}

export async function loadPreferencePairQueueCandidates(
  supabase: SupabaseClient,
  opts: { tenantId?: string; limit?: number }
): Promise<ExpertReviewQueueCandidate[]> {
  let query = supabase
    .from("ai_preference_pairs")
    .select("id, tenant_id, task_type, audience, input_json, rejected_json, chosen_json, low_value")
    .eq("low_value", false)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data } = await query;
  if (!data?.length) return [];

  return data.map((p) => ({
    tenantId: p.tenant_id as string,
    sourceTable: "ai_preference_pairs",
    sourceId: p.id as string,
    taskType: (p.task_type as string) || "copilot_chat",
    audience: (p.audience as string) || "manager",
    inputJson: (p.input_json as Record<string, unknown>) ?? {},
    modelOutputJson: (p.rejected_json as Record<string, unknown>) ?? {},
    provenance: "preference_pair" as const,
  }));
}

export async function loadLowScoreFeedbackQueueCandidates(
  supabase: SupabaseClient,
  opts: { tenantId?: string; limit?: number }
): Promise<ExpertReviewQueueCandidate[]> {
  let query = supabase
    .from("ai_feedback_records")
    .select("id, tenant_id, feedback_category, comments, factuality_score, usefulness_score")
    .or(`factuality_score.lte.${LOW_SCORE_THRESHOLD},usefulness_score.lte.${LOW_SCORE_THRESHOLD}`)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data } = await query;
  if (!data?.length) return [];

  return data.map((f) => ({
    tenantId: f.tenant_id as string,
    sourceTable: "ai_feedback_records",
    sourceId: f.id as string,
    taskType: "copilot_chat",
    audience: "manager",
    inputJson: { category: f.feedback_category, comments: f.comments ?? "" },
    modelOutputJson: {
      factuality_score: f.factuality_score,
      usefulness_score: f.usefulness_score,
    },
    priority: "high" as const,
    provenance: "feedback_record" as const,
  }));
}
