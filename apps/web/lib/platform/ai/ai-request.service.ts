/**
 * AI request service - handles listing and querying AI jobs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as jobRepo from "../jobs/job.repository";

export interface AIRequestItem {
  id: string;
  type: string;
  status: string;
  entity: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListAIRequestsFilters {
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  limit: number;
  offset: number;
}

/**
 * List AI requests (jobs) for tenant.
 */
export async function listAIRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  filters: ListAIRequestsFilters
): Promise<{ data: AIRequestItem[]; total: number; error: string }> {
  if (!ctx.tenantId) {
    return { data: [], total: 0, error: "Unauthorized" };
  }

  const AI_JOB_TYPES = ["ai_analyze_media", "ai_analyze_report"];

  // Build query
  let query = supabase
    .from("jobs")
    .select("id, type, status, payload, attempts, last_error, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", ctx.tenantId)
    .in("type", AI_JOB_TYPES)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const fetchLimit = filters.q ? Math.min(200, 200) : filters.limit;
  const fetchOffset = filters.q ? 0 : filters.offset;
  const { data: rows, error, count } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);

  if (error) {
    return { data: [], total: 0, error: error.message };
  }

  // Transform to AI request items
  let list = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    entity:
      (r.payload as { report_id?: string; media_id?: string })?.report_id ??
      (r.payload as { media_id?: string })?.media_id ??
      null,
    attempts: r.attempts,
    last_error: r.last_error ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })) as AIRequestItem[];

  // Apply search filter if provided
  if (filters.q) {
    const qLower = filters.q.toLowerCase();
    list = list.filter(
      (item) =>
        String(item.id).toLowerCase().startsWith(qLower) ||
        String(item.id).toLowerCase().includes(qLower) ||
        (item.entity && String(item.entity).toLowerCase().includes(qLower))
    );
  }

  const total = filters.q ? list.length : count ?? 0;
  const paginated = filters.q ? list.slice(0, filters.limit) : list;

  return { data: paginated, total, error: "" };
}

/**
 * Get single AI request by ID.
 */
export async function getAIRequest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  requestId: string
): Promise<{ data: AIRequestItem | null; error: string }> {
  if (!ctx.tenantId) {
    return { data: null, error: "Unauthorized" };
  }

  const AI_JOB_TYPES = ["ai_analyze_media", "ai_analyze_report"];

  const { data: row, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", requestId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!row) {
    return { data: null, error: "Not found" };
  }

  const r = row as { type: string; payload?: unknown };
  if (!AI_JOB_TYPES.includes(r.type)) {
    return { data: null, error: "Not an AI request" };
  }

  return {
    data: {
      id: (row as { id: string }).id,
      type: (row as { type: string }).type,
      status: (row as { status: string }).status,
      entity:
        ((row as { payload?: { report_id?: string; media_id?: string } }).payload?.report_id ??
          (row as { payload?: { media_id?: string } }).payload?.media_id) ??
        null,
      attempts: (row as { attempts: number }).attempts,
      last_error: (row as { last_error?: string | null }).last_error ?? null,
      created_at: (row as { created_at: string }).created_at,
      updated_at: (row as { updated_at: string }).updated_at,
    },
    error: "",
  };
}
