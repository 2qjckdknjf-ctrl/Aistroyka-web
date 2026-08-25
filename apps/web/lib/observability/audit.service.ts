import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "login"
  | "invite"
  | "role_change"
  | "task_assignment"
  | "report_submit"
  | "report_review"
  | "media_finalize"
  | "ai_analysis_complete"
  | "ai_copilot_stream_complete"
  | "ai_copilot_stream_error"
  | "ai_copilot_non_stream_complete"
  | "ai_intelligence_complete"
  | "ai_intelligence_error"
  | "ai_vision_analyze_complete"
  | "ai_vision_analyze_error"
  | "ai_video_daily_complete"
  | "ai_video_daily_error"
  | "ai_transcription_complete"
  | "ai_transcription_error"
  | "export";

export type AiRuntimeAuditAction =
  | "ai_copilot_stream_complete"
  | "ai_copilot_stream_error"
  | "ai_copilot_non_stream_complete"
  | "ai_intelligence_complete"
  | "ai_intelligence_error"
  | "ai_vision_analyze_complete"
  | "ai_vision_analyze_error"
  | "ai_video_daily_complete"
  | "ai_video_daily_error"
  | "ai_transcription_complete"
  | "ai_transcription_error";

export interface AuditEmitParams {
  tenant_id: string;
  user_id?: string | null;
  trace_id?: string | null;
  action: AuditAction | string;
  resource_type?: string | null;
  resource_id?: string | null;
  details?: Record<string, unknown>;
}

/** Emit one audit log entry. Best-effort; does not throw. */
export async function emitAudit(supabase: SupabaseClient, params: AuditEmitParams): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      tenant_id: params.tenant_id,
      user_id: params.user_id ?? null,
      trace_id: params.trace_id ?? null,
      action: params.action,
      resource_type: params.resource_type ?? null,
      resource_id: params.resource_id ?? null,
      details: params.details ?? {},
    });
  } catch {
    // Do not throw; audit is best-effort
  }
}

export interface AuditLogRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  trace_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

/** Safe AI runtime metadata for audit_logs. No prompts, secrets, or raw context. */
export interface AiRuntimeAuditDetails {
  request_id: string;
  route: string;
  latency_ms: number;
  output_type: "copilot" | "intelligence" | "vision" | "video_daily" | "transcription";
  streaming?: boolean;
  fallback_triggered?: boolean;
  fallback_reason?: string;
  provider?: string;
  error_kind?: string;
  retryable?: boolean;
  context_tokens_estimated?: number;
  context_trim_applied?: boolean;
  build_sha7?: string;
  app_env?: string;
  first_token_ms?: number | null;
  intelligence_diagnostics?: Record<string, unknown>;
  insights_count?: number;
}

/** Emit AI runtime event to audit_logs. Best-effort; does not throw. */
export async function emitAiRuntimeAudit(
  supabase: SupabaseClient,
  params: {
    tenant_id: string;
    user_id?: string | null;
    trace_id?: string | null;
    project_id?: string | null;
    action: AiRuntimeAuditAction;
    details: AiRuntimeAuditDetails;
  }
): Promise<void> {
  await emitAudit(supabase, {
    tenant_id: params.tenant_id,
    user_id: params.user_id ?? null,
    trace_id: params.trace_id ?? null,
    action: params.action,
    resource_type: "ai_runtime",
    resource_id: params.project_id ?? null,
    details: { ...params.details },
  });
}

/** List audit logs for tenant in range (admin only). */
export async function listAuditLogs(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<AuditLogRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const startStr = start.toISOString();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, tenant_id, user_id, trace_id, action, resource_type, resource_id, details, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", startStr)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as AuditLogRow[];
}

/** List audit events for one action (e.g. manager AI risk decisions). */
export async function listAuditLogsByAction(
  supabase: SupabaseClient,
  tenantId: string,
  action: string,
  options: { resourceId?: string; limit?: number } = {}
): Promise<AuditLogRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  let query = supabase
    .from("audit_logs")
    .select("id, tenant_id, user_id, trace_id, action, resource_type, resource_id, details, created_at")
    .eq("tenant_id", tenantId)
    .eq("action", action);
  if (options.resourceId?.trim()) {
    query = query.eq("resource_id", options.resourceId.trim());
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
  if (error) return [];
  return (data ?? []) as AuditLogRow[];
}

/** List audit events for a single resource (e.g. report approval history). */
export async function listAuditLogsForResource(
  supabase: SupabaseClient,
  tenantId: string,
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, tenant_id, user_id, trace_id, action, resource_type, resource_id, details, created_at")
    .eq("tenant_id", tenantId)
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AuditLogRow[];
}

const AI_RUNTIME_ACTION_PREFIX = "ai_";

/** AI runtime rows for operator diagnostics (tenant-scoped). */
export async function listAiRuntimeAuditRows(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { limit?: number; hours?: number }
): Promise<AuditLogRow[]> {
  const hours = opts.hours ?? 168;
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, tenant_id, user_id, trace_id, action, resource_type, resource_id, details, created_at")
    .eq("tenant_id", tenantId)
    .eq("resource_type", "ai_runtime")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 300);
  if (error) return [];
  return (data ?? []).filter((r) => String(r.action ?? "").startsWith(AI_RUNTIME_ACTION_PREFIX)) as AuditLogRow[];
}

export function aggregateAiRuntimeRows(rows: AuditLogRow[]): {
  by_action: Record<string, number>;
  errors_by_kind: Record<string, number>;
  recent_error_sample: Array<{ trace_id: string | null; action: string; error_kind?: string; at: string }>;
} {
  const by_action: Record<string, number> = {};
  const errors_by_kind: Record<string, number> = {};
  const recent_error_sample: Array<{
    trace_id: string | null;
    action: string;
    error_kind?: string;
    at: string;
  }> = [];

  for (const r of rows) {
    const a = r.action ?? "unknown";
    by_action[a] = (by_action[a] ?? 0) + 1;
    const d = r.details as Record<string, unknown> | undefined;
    const ek = typeof d?.error_kind === "string" ? d.error_kind : undefined;
    if (a.includes("error") && ek) {
      errors_by_kind[ek] = (errors_by_kind[ek] ?? 0) + 1;
    }
    if (a.includes("error") && recent_error_sample.length < 20) {
      recent_error_sample.push({
        trace_id: r.trace_id,
        action: a,
        error_kind: ek,
        at: r.created_at,
      });
    }
  }
  return { by_action, errors_by_kind, recent_error_sample };
}
