/**
 * AI action audit repository — append-only persistence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface AiActionAuditInsert {
  tenant_id: string;
  project_id?: string | null;
  initiated_by?: string | null;
  action_id: string;
  policy_version: string;
  source_refs?: Array<{ type: string; id: string }>;
  provider?: string | null;
  model?: string | null;
  ai_generated?: boolean;
  confidence?: number | null;
  dry_run?: boolean;
  approved_by?: string | null;
  target_resource_type?: string | null;
  target_resource_id?: string | null;
  outcome: "success" | "error" | "blocked" | "dry_run";
  error_category?: string | null;
  idempotency_key?: string | null;
  details?: Record<string, unknown>;
}

export interface AiActionAuditRow extends AiActionAuditInsert {
  id: string;
  executed_at: string;
  created_at: string;
}

export async function findByIdempotencyKey(
  supabase: SupabaseClient,
  tenantId: string,
  idempotencyKey: string
): Promise<AiActionAuditRow | null> {
  const { data, error } = await supabase
    .from("ai_action_audit_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error || !data) return null;
  return data as AiActionAuditRow;
}

export async function insertAiActionAudit(
  supabase: SupabaseClient,
  row: AiActionAuditInsert
): Promise<AiActionAuditRow | null> {
  const { data, error } = await supabase
    .from("ai_action_audit_records")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id ?? null,
      initiated_by: row.initiated_by ?? null,
      action_id: row.action_id,
      policy_version: row.policy_version,
      source_refs: row.source_refs ?? [],
      provider: row.provider ?? null,
      model: row.model ?? null,
      ai_generated: row.ai_generated ?? true,
      confidence: row.confidence ?? null,
      dry_run: row.dry_run ?? false,
      approved_by: row.approved_by ?? null,
      target_resource_type: row.target_resource_type ?? null,
      target_resource_id: row.target_resource_id ?? null,
      outcome: row.outcome,
      error_category: row.error_category ?? null,
      idempotency_key: row.idempotency_key ?? null,
      details: row.details ?? {},
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return data as AiActionAuditRow;
}
