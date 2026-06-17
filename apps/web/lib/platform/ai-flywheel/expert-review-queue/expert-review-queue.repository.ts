/**
 * Expert Review Queue repository — service-role only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ExpertReviewQueueCandidate,
  ExpertReviewQueueRow,
  ExpertReviewQueueStatus,
} from "./expert-review-queue.types";

export async function findQueueBySource(
  supabase: SupabaseClient,
  sourceTable: string,
  sourceId: string
): Promise<ExpertReviewQueueRow | null> {
  const { data } = await supabase
    .from("ai_expert_review_queue")
    .select("*")
    .eq("source_table", sourceTable)
    .eq("source_id", sourceId)
    .maybeSingle();
  return (data as ExpertReviewQueueRow) ?? null;
}

export async function insertQueueItem(
  supabase: SupabaseClient,
  candidate: ExpertReviewQueueCandidate & {
    inputJson: Record<string, unknown>;
    modelOutputJson: Record<string, unknown>;
  }
): Promise<{ written: boolean; id?: string; reason?: string }> {
  const { data, error } = await supabase
    .from("ai_expert_review_queue")
    .insert({
      tenant_id: candidate.tenantId,
      source_table: candidate.sourceTable,
      source_id: candidate.sourceId,
      task_type: candidate.taskType,
      audience: candidate.audience,
      input_json: candidate.inputJson,
      model_output_json: candidate.modelOutputJson,
      priority: candidate.priority ?? "normal",
      status: "pending",
      provenance: candidate.provenance,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { written: false, reason: error.message };
  return { written: true, id: data?.id as string };
}

export async function listPendingQueueItems(
  supabase: SupabaseClient,
  tenantId: string,
  limit = 50
): Promise<ExpertReviewQueueRow[]> {
  const { data } = await supabase
    .from("ai_expert_review_queue")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ExpertReviewQueueRow[];
}

export async function getQueueItemById(
  supabase: SupabaseClient,
  tenantId: string,
  queueId: string
): Promise<ExpertReviewQueueRow | null> {
  const { data } = await supabase
    .from("ai_expert_review_queue")
    .select("*")
    .eq("id", queueId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return (data as ExpertReviewQueueRow) ?? null;
}

export async function updateQueueStatus(
  supabase: SupabaseClient,
  queueId: string,
  tenantId: string,
  status: ExpertReviewQueueStatus,
  assignedExpertUserId?: string | null
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (assignedExpertUserId !== undefined) {
    patch.assigned_expert_user_id = assignedExpertUserId;
  }

  const { error } = await supabase
    .from("ai_expert_review_queue")
    .update(patch)
    .eq("id", queueId)
    .eq("tenant_id", tenantId);

  return !error;
}

export async function listExistingQueueSourceIds(
  supabase: SupabaseClient,
  sourceTable: string,
  sourceIds: string[]
): Promise<Set<string>> {
  if (sourceIds.length === 0) return new Set();
  const { data } = await supabase
    .from("ai_expert_review_queue")
    .select("source_id")
    .eq("source_table", sourceTable)
    .in("source_id", sourceIds);
  return new Set((data ?? []).map((r) => r.source_id as string));
}
