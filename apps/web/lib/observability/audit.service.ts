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
  | "export";

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
  output_type: "copilot" | "intelligence" | "vision";
  streaming?: boolean;
  fallback_triggered?: boolean;
  fallback_reason?: string;
  provider?: string;
  error_kind?: string;
  retryable?: boolean;
  context_tokens_estimated?: number;
  context_trim_applied?: boolean;
  build_sha7?: string;
}

/** Emit AI runtime event to audit_logs. Best-effort; does not throw. */
export async function emitAiRuntimeAudit(
  supabase: SupabaseClient,
  params: {
    tenant_id: string;
    user_id?: string | null;
    trace_id?: string | null;
    project_id?: string | null;
    action: "ai_copilot_stream_complete" | "ai_copilot_stream_error" | "ai_copilot_non_stream_complete";
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
