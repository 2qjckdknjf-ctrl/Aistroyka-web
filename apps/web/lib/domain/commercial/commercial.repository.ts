import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommercialItemRow, CommercialAggregates, CommercialItemEventKind } from "./commercial.types";
import type { CommercialItemStatus } from "./commercial.types";
import { isEffectivelyOverdue, todayUtcDateString } from "./commercial.overdue";

const UNPAID_OPEN: CommercialItemStatus[] = ["issued", "due", "overdue"];

export { isEffectivelyOverdue } from "./commercial.overdue";

export async function refreshOverdueForProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<void> {
  const today = todayUtcDateString();
  await supabase
    .from("project_commercial_items")
    .update({ status: "overdue" })
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .in("status", ["issued", "due"])
    .not("due_date", "is", null)
    .lt("due_date", today);
}

export async function refreshOverdueForTenant(supabase: SupabaseClient, tenantId: string): Promise<void> {
  const today = todayUtcDateString();
  await supabase
    .from("project_commercial_items")
    .update({ status: "overdue" })
    .eq("tenant_id", tenantId)
    .in("status", ["issued", "due"])
    .not("due_date", "is", null)
    .lt("due_date", today);
}

export async function listCommercialItemsForProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<CommercialItemRow[]> {
  await refreshOverdueForProject(supabase, tenantId, projectId);
  const { data, error } = await supabase
    .from("project_commercial_items")
    .select(
      "id, tenant_id, project_id, kind, title, description, amount, currency, due_date, status, paid_at, linked_change_order_id, linked_document_id, created_by, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as CommercialItemRow[]).map(normalizeRow);
}

function normalizeRow(r: CommercialItemRow): CommercialItemRow {
  return {
    ...r,
    amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount,
  };
}

export async function getCommercialItemById(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  itemId: string
): Promise<CommercialItemRow | null> {
  await refreshOverdueForProject(supabase, tenantId, projectId);
  const { data, error } = await supabase
    .from("project_commercial_items")
    .select(
      "id, tenant_id, project_id, kind, title, description, amount, currency, due_date, status, paid_at, linked_change_order_id, linked_document_id, created_by, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("id", itemId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeRow(data as CommercialItemRow);
}

export async function insertCommercialItemEvent(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  itemId: string,
  input: {
    event_kind: CommercialItemEventKind;
    from_status?: CommercialItemStatus | null;
    to_status?: CommercialItemStatus | null;
    actor_user_id: string;
    note?: string | null;
  }
): Promise<void> {
  await supabase.from("project_commercial_item_events").insert({
    tenant_id: tenantId,
    project_id: projectId,
    commercial_item_id: itemId,
    event_kind: input.event_kind,
    from_status: input.from_status ?? null,
    to_status: input.to_status ?? null,
    actor_user_id: input.actor_user_id,
    note: input.note ?? null,
  });
}

export async function getCommercialAggregatesForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  budgetCurrency: string
): Promise<CommercialAggregates> {
  const { data, error } = await supabase
    .from("project_commercial_items")
    .select("status, amount, currency, due_date")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId);
  if (error || !data) {
    return { itemCount: 0, overdueCount: 0, outstandingAmount: 0, currency: budgetCurrency };
  }
  const rows = data as Array<{
    status: CommercialItemStatus;
    amount: number | string;
    currency: string;
    due_date: string | null;
  }>;
  let overdueCount = 0;
  let outstandingAmount = 0;
  for (const r of rows) {
    const amount = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount;
    const st = r.status;
    if (isEffectivelyOverdue({ status: st, due_date: r.due_date })) {
      overdueCount += 1;
    }
    if (UNPAID_OPEN.includes(st) || st === "overdue") {
      if (r.currency === budgetCurrency) {
        outstandingAmount += amount;
      }
    }
  }
  return {
    itemCount: rows.length,
    overdueCount,
    outstandingAmount,
    currency: budgetCurrency,
  };
}

export async function countTenantCommercialOverdue(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ overdueCount: number; openUnpaidCount: number }> {
  await refreshOverdueForTenant(supabase, tenantId);
  const { data, error } = await supabase
    .from("project_commercial_items")
    .select("id, status, due_date")
    .eq("tenant_id", tenantId);
  if (error || !data) return { overdueCount: 0, openUnpaidCount: 0 };
  const rows = data as Array<{ status: CommercialItemStatus; due_date: string | null }>;
  let overdueCount = 0;
  let openUnpaidCount = 0;
  for (const r of rows) {
    if (isEffectivelyOverdue({ status: r.status, due_date: r.due_date })) overdueCount += 1;
    if (UNPAID_OPEN.includes(r.status)) openUnpaidCount += 1;
  }
  return { overdueCount, openUnpaidCount };
}
