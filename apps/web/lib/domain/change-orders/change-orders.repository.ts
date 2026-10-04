import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChangeOrderEventRow,
  ChangeOrderKind,
  ChangeOrderListItem,
  ChangeOrderRow,
  ChangeOrderStatus,
  BudgetImpactLevel,
  ScheduleImpactLevel,
} from "./change-orders.types";

const ROW_SELECT =
  "id, tenant_id, project_id, kind, status, title, description, reason, schedule_impact_level, budget_impact_level, schedule_impact_summary, budget_impact_summary, schedule_delta_days, budget_delta_amount, customer_amount_delta, currency, linked_discussion_id, linked_document_id, linked_request_id, linked_milestone_id, linked_customer_estimate_id, internal_cost_item_id, created_by, approved_by_customer, approved_at, implemented_at, implemented_by, created_at, updated_at";

export async function insertChangeOrder(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    kind: ChangeOrderKind;
    status: ChangeOrderStatus;
    title: string;
    description: string | null;
    reason: string | null;
    schedule_impact_level: ScheduleImpactLevel;
    budget_impact_level: BudgetImpactLevel;
    schedule_impact_summary: string | null;
    budget_impact_summary: string | null;
    schedule_delta_days: number | null;
    budget_delta_amount: number | null;
    customer_amount_delta: number | null;
    currency: string;
    linked_discussion_id: string | null;
    linked_document_id: string | null;
    linked_request_id: string | null;
    linked_milestone_id: string | null;
    linked_customer_estimate_id: string | null;
    internal_cost_item_id: string | null;
    created_by: string;
  }
): Promise<ChangeOrderRow | null> {
  const { data, error } = await supabase
    .from("project_change_orders")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      kind: row.kind,
      status: row.status,
      title: row.title.trim(),
      description: row.description?.trim() || null,
      reason: row.reason?.trim() || null,
      schedule_impact_level: row.schedule_impact_level,
      budget_impact_level: row.budget_impact_level,
      schedule_impact_summary: row.schedule_impact_summary?.trim() || null,
      budget_impact_summary: row.budget_impact_summary?.trim() || null,
      schedule_delta_days: row.schedule_delta_days,
      budget_delta_amount: row.budget_delta_amount,
      customer_amount_delta: row.customer_amount_delta,
      currency: row.currency,
      linked_discussion_id: row.linked_discussion_id,
      linked_document_id: row.linked_document_id,
      linked_request_id: row.linked_request_id,
      linked_milestone_id: row.linked_milestone_id,
      linked_customer_estimate_id: row.linked_customer_estimate_id,
      internal_cost_item_id: row.internal_cost_item_id,
      created_by: row.created_by,
    })
    .select(ROW_SELECT)
    .single();
  if (error || !data) return null;
  return data as ChangeOrderRow;
}

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number; excludeDraft?: boolean }
): Promise<ChangeOrderListItem[]> {
  const limit = Math.min(opts?.limit ?? 80, 120);
  let q = supabase
    .from("project_change_orders")
    .select(
      "id, kind, status, title, schedule_impact_level, budget_impact_level, customer_amount_delta, currency, updated_at"
    )
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (opts?.excludeDraft) {
    q = q.neq("status", "draft");
  }
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as ChangeOrderListItem[];
}

export async function getById(
  supabase: SupabaseClient,
  id: string,
  tenantId: string
): Promise<ChangeOrderRow | null> {
  const { data, error } = await supabase
    .from("project_change_orders")
    .select(ROW_SELECT)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ChangeOrderRow;
}

export async function updateChangeOrder(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    reason: string | null;
    kind: ChangeOrderKind;
    schedule_impact_level: ScheduleImpactLevel;
    budget_impact_level: BudgetImpactLevel;
    schedule_impact_summary: string | null;
    budget_impact_summary: string | null;
    schedule_delta_days: number | null;
    budget_delta_amount: number | null;
    customer_amount_delta: number | null;
    currency: string;
    linked_discussion_id: string | null;
    linked_document_id: string | null;
    linked_request_id: string | null;
    linked_milestone_id: string | null;
    linked_customer_estimate_id: string | null;
    internal_cost_item_id: string | null;
    status: ChangeOrderStatus;
    approved_by_customer: string | null;
    approved_at: string | null;
    implemented_at: string | null;
    implemented_by: string | null;
  }>
): Promise<boolean> {
  // Require a returned row so RLS-filtered 0-row updates fail closed (PostgREST
  // returns no error when UPDATE matches zero rows).
  const { data, error } = await supabase
    .from("project_change_orders")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("id")
    .maybeSingle();
  return !error && !!data;
}

export async function listEvents(
  supabase: SupabaseClient,
  changeOrderId: string,
  tenantId: string
): Promise<ChangeOrderEventRow[]> {
  const { data, error } = await supabase
    .from("project_change_order_events")
    .select("id, change_order_id, from_status, to_status, actor_user_id, note, created_at")
    .eq("change_order_id", changeOrderId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as ChangeOrderEventRow[];
}

export async function insertEvent(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    change_order_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
  }
): Promise<ChangeOrderEventRow | null> {
  const { data, error } = await supabase
    .from("project_change_order_events")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      change_order_id: row.change_order_id,
      from_status: row.from_status,
      to_status: row.to_status,
      actor_user_id: row.actor_user_id,
      note: row.note?.trim() || null,
    })
    .select("id, change_order_id, from_status, to_status, actor_user_id, note, created_at")
    .single();
  if (error || !data) return null;
  return data as ChangeOrderEventRow;
}

export async function listForTimeline(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<
  Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    implemented_at: string | null;
  }>
> {
  const limit = Math.min(opts?.limit ?? 50, 80);
  const { data, error } = await supabase
    .from("project_change_orders")
    .select("id, title, status, created_at, updated_at, implemented_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .neq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    implemented_at: string | null;
  }>;
}
