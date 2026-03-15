import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectCostItem,
  CreateCostItemInput,
  UpdateCostItemInput,
  ProjectBudgetSummary,
} from "./cost.types";

const COST_ITEM_SELECT =
  "id, tenant_id, project_id, category, title, planned_amount, actual_amount, currency, status, notes, milestone_id, created_by, created_at, updated_at";

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectCostItem[]> {
  const { data, error } = await supabase
    .from("project_cost_items")
    .select(COST_ITEM_SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => normalizeCostItem(r) as unknown as ProjectCostItem);
}

export async function getById(
  supabase: SupabaseClient,
  costItemId: string,
  tenantId: string
): Promise<ProjectCostItem | null> {
  const { data, error } = await supabase
    .from("project_cost_items")
    .select(COST_ITEM_SELECT)
    .eq("id", costItemId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeCostItem(data) as unknown as ProjectCostItem;
}

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  input: CreateCostItemInput
): Promise<ProjectCostItem | null> {
  const { data, error } = await supabase
    .from("project_cost_items")
    .insert({
      tenant_id: tenantId,
      project_id: input.project_id,
      category: input.category?.trim() || "other",
      title: input.title.trim(),
      planned_amount: Number(input.planned_amount) ?? 0,
      actual_amount: Number(input.actual_amount) ?? 0,
      currency: input.currency?.trim() || "RUB",
      status: input.status ?? "planned",
      notes: input.notes?.trim() || null,
      milestone_id: input.milestone_id ?? null,
      created_by: userId,
    })
    .select(COST_ITEM_SELECT)
    .single();
  if (error || !data) return null;
  return normalizeCostItem(data) as unknown as ProjectCostItem;
}

export async function update(
  supabase: SupabaseClient,
  costItemId: string,
  tenantId: string,
  input: UpdateCostItemInput
): Promise<ProjectCostItem | null> {
  const payload: Record<string, unknown> = {};
  if (input.category !== undefined) payload.category = input.category.trim() || "other";
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.planned_amount !== undefined) payload.planned_amount = Number(input.planned_amount);
  if (input.actual_amount !== undefined) payload.actual_amount = Number(input.actual_amount);
  if (input.currency !== undefined) payload.currency = input.currency.trim();
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;
  if (input.milestone_id !== undefined) payload.milestone_id = input.milestone_id;

  if (Object.keys(payload).length === 0) {
    return getById(supabase, costItemId, tenantId);
  }

  const { data, error } = await supabase
    .from("project_cost_items")
    .update(payload)
    .eq("id", costItemId)
    .eq("tenant_id", tenantId)
    .select(COST_ITEM_SELECT)
    .single();
  if (error || !data) return null;
  return normalizeCostItem(data) as unknown as ProjectCostItem;
}

export async function getBudgetSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectBudgetSummary | null> {
  const { data, error } = await supabase
    .from("project_cost_items")
    .select("planned_amount, actual_amount, currency")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .neq("status", "archived");
  if (error) return null;

  const rows = (data ?? []) as { planned_amount: number; actual_amount: number; currency: string }[];
  const currency = rows[0]?.currency ?? "RUB";
  const planned_total = rows.reduce((s, r) => s + Number(r.planned_amount ?? 0), 0);
  const actual_total = rows.reduce((s, r) => s + Number(r.actual_amount ?? 0), 0);

  return {
    project_id: projectId,
    tenant_id: tenantId,
    planned_total,
    actual_total,
    currency,
    over_budget: actual_total > planned_total,
    item_count: rows.length,
  };
}

function normalizeCostItem(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    planned_amount: Number(row.planned_amount ?? 0),
    actual_amount: Number(row.actual_amount ?? 0),
  };
}
