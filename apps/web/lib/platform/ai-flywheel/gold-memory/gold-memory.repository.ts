/**
 * Gold Memory repository — service-role only (RLS deny-all).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoldMemoryInsertRow, GoldMemoryRow } from "./gold-memory.types";

export async function findGoldMemoryBySource(
  supabase: SupabaseClient,
  sourceTable: string,
  sourceId: string
): Promise<GoldMemoryRow | null> {
  const { data, error } = await supabase
    .from("ai_gold_memory")
    .select("*")
    .eq("source_table", sourceTable)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (error || !data) return null;
  return data as GoldMemoryRow;
}

export async function upsertGoldMemoryRow(
  supabase: SupabaseClient,
  row: GoldMemoryInsertRow
): Promise<{ written: boolean; id?: string; reason?: string }> {
  const { data, error } = await supabase
    .from("ai_gold_memory")
    .upsert(
      {
        ...row,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "source_table,source_id" }
    )
    .select("id")
    .single();

  if (error) {
    return { written: false, reason: error.message };
  }
  return { written: true, id: data?.id as string };
}

export async function listActiveGoldMemoryForTenant(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    taskType: string;
    audience: string;
    limit?: number;
  }
): Promise<GoldMemoryRow[]> {
  const { data, error } = await supabase
    .from("ai_gold_memory")
    .select("*")
    .eq("tenant_id", params.tenantId)
    .eq("task_type", params.taskType)
    .eq("audience", params.audience)
    .eq("is_active", true)
    .eq("consent_snapshot", true)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 50);

  if (error || !data) return [];
  return data as GoldMemoryRow[];
}

export async function listExistingSourceIds(
  supabase: SupabaseClient,
  sourceTable: string,
  sourceIds: string[]
): Promise<Set<string>> {
  if (sourceIds.length === 0) return new Set();
  const { data } = await supabase
    .from("ai_gold_memory")
    .select("source_id")
    .eq("source_table", sourceTable)
    .in("source_id", sourceIds);

  return new Set((data ?? []).map((r) => r.source_id as string));
}
