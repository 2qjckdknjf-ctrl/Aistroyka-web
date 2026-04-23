/**
 * AI Brain Phase C — Memory repository.
 * Additive persistence. Tenant/project/user scoped.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiMemoryRecord, AiMemoryStatus, AiMemoryType } from "../memory/memory.types";

const SELECT_COLS =
  "id, tenant_id, project_id, user_id, memory_type, scope, source_kind, source_ref, title, body, facts_used, grounding_refs, confidence, expires_at, status, superseded_by, created_at, updated_at";

function rowToRecord(r: Record<string, unknown>): AiMemoryRecord {
  return {
    memoryId: r.id as string,
    tenantId: r.tenant_id as string,
    projectId: (r.project_id as string) ?? null,
    userId: (r.user_id as string) ?? null,
    memoryType: r.memory_type as AiMemoryRecord["memoryType"],
    scope: r.scope as AiMemoryRecord["scope"],
    sourceKind: r.source_kind as AiMemoryRecord["sourceKind"],
    sourceRef: (r.source_ref as string) ?? null,
    title: r.title as string,
    body: r.body,
    factsUsed: (r.facts_used as string[]) ?? [],
    groundingRefs: (r.grounding_refs as string[]) ?? [],
    confidence: r.confidence as AiMemoryRecord["confidence"],
    expiresAt: (r.expires_at as string) ?? null,
    status: r.status as AiMemoryStatus,
    supersededBy: (r.superseded_by as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export interface CreateMemoryInput {
  tenantId: string;
  projectId?: string | null;
  userId?: string | null;
  memoryType: AiMemoryType;
  scope: AiMemoryRecord["scope"];
  sourceKind: AiMemoryRecord["sourceKind"];
  sourceRef?: string | null;
  title: string;
  body: unknown;
  factsUsed?: string[];
  groundingRefs?: string[];
  confidence?: AiMemoryRecord["confidence"];
  expiresAt?: string | null;
}

export async function createMemoryRecord(
  supabase: SupabaseClient,
  input: CreateMemoryInput
): Promise<AiMemoryRecord | null> {
  const { data, error } = await supabase
    .from("ai_memory_records")
    .insert({
      tenant_id: input.tenantId,
      project_id: input.projectId ?? null,
      user_id: input.userId ?? null,
      memory_type: input.memoryType,
      scope: input.scope,
      source_kind: input.sourceKind,
      source_ref: input.sourceRef ?? null,
      title: input.title,
      body: input.body ?? {},
      facts_used: input.factsUsed ?? [],
      grounding_refs: input.groundingRefs ?? [],
      confidence: input.confidence ?? "medium",
      expires_at: input.expiresAt ?? null,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .select(SELECT_COLS)
    .single();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function getRelevantMemory(
  supabase: SupabaseClient,
  tenantId: string,
  opts: {
    projectId?: string | null;
    userId?: string | null;
    memoryTypes?: AiMemoryType[];
    limit?: number;
    minConfidence?: AiMemoryRecord["confidence"];
  }
): Promise<AiMemoryRecord[]> {
  let q = supabase
    .from("ai_memory_records")
    .select(SELECT_COLS)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.projectId) q = q.eq("project_id", opts.projectId);
  if (opts.userId) q = q.or(`user_id.eq.${opts.userId},user_id.is.null`);
  if (opts.memoryTypes?.length) q = q.in("memory_type", opts.memoryTypes);

  const { data, error } = await q;
  if (error || !data) return [];

  const now = new Date().toISOString();
  const records = (data as Record<string, unknown>[]).map(rowToRecord);
  return records.filter((r) => {
    if (r.expiresAt && r.expiresAt < now) return false;
    return true;
  });
}

export async function markMemorySuperseded(
  supabase: SupabaseClient,
  memoryId: string,
  supersededBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from("ai_memory_records")
    .update({
      status: "superseded",
      superseded_by: supersededBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId);

  return !error;
}

export async function expireMemory(
  supabase: SupabaseClient,
  memoryId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("ai_memory_records")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", memoryId);

  return !error;
}
