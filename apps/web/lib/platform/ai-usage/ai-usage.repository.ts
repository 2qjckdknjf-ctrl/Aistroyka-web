import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiUsageRecord } from "./ai-usage.types";

export async function insertUsage(
  supabase: SupabaseClient,
  record: AiUsageRecord
): Promise<void> {
  const { error } = await supabase.from("ai_usage").insert({
    tenant_id: record.tenant_id,
    user_id: record.user_id,
    trace_id: record.trace_id,
    provider: record.provider,
    model: record.model,
    tokens_input: record.tokens_input,
    tokens_output: record.tokens_output,
    tokens_total: record.tokens_total,
    cost_usd: record.cost_usd,
    status: record.status,
    error_type: record.error_type,
    duration_ms: record.duration_ms,
  });
  if (error) throw new Error("ai_usage_insert_failed");
}

export async function getSpentForPeriod(
  supabase: SupabaseClient,
  tenantId: string,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  const { data, error } = await supabase
    .from("ai_usage")
    .select("cost_usd")
    .eq("tenant_id", tenantId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);
  if (error || !data) throw new Error("ai_usage_period_read_failed");
  return (data as { cost_usd: number }[]).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
}

export async function getOrCreateBillingState(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ period_start: string; period_end: string; budget_usd: number; spent_usd: number } | null> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tenant_billing_state")
    .select("period_start, period_end, budget_usd, spent_usd")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error("tenant_billing_state_read_failed");
  if (data) return data as { period_start: string; period_end: string; budget_usd: number; spent_usd: number };

  const { error: insertError } = await supabase.from("tenant_billing_state").insert({
    tenant_id: tenantId,
    period_start: periodStart,
    period_end: periodEnd,
    budget_usd: 0,
    spent_usd: 0,
  });
  if (insertError) throw new Error("tenant_billing_state_insert_failed");
  return { period_start: periodStart, period_end: periodEnd, budget_usd: 0, spent_usd: 0 };
}

export async function addSpent(
  supabase: SupabaseClient,
  tenantId: string,
  amountUsd: number
): Promise<void> {
  const row = await getOrCreateBillingState(supabase, tenantId);
  if (!row) throw new Error("tenant_billing_state_unavailable");
  const { data, error } = await supabase
    .from("tenant_billing_state")
    .update({ spent_usd: row.spent_usd + amountUsd })
    .eq("tenant_id", tenantId)
    .select("tenant_id")
    .maybeSingle();
  if (error || !data) throw new Error("tenant_billing_state_update_failed");
}
