import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./change-orders.repository";
import { canManageChangeOrders, canReadChangeOrders } from "./change-orders.policy";
import type {
  ChangeOrderDetailManager,
  ChangeOrderKind,
  ChangeOrderListItem,
  ChangeOrderPublicDetail,
  ChangeOrderPublicListItem,
  ChangeOrderRow,
  ChangeOrderStatus,
  BudgetImpactLevel,
  ScheduleImpactLevel,
} from "./change-orders.types";

const KINDS: ChangeOrderKind[] = [
  "owner_variation",
  "manager_proposed",
  "document_linked",
  "decision_derived",
  "other",
];

const STATUSES: ChangeOrderStatus[] = [
  "draft",
  "proposed",
  "under_review",
  "approved",
  "rejected",
  "implemented",
  "archived",
];

const TRANSITIONS: Record<ChangeOrderStatus, ChangeOrderStatus[]> = {
  draft: ["proposed", "archived"],
  proposed: ["under_review", "approved", "rejected", "draft", "archived"],
  under_review: ["approved", "rejected", "proposed", "archived"],
  approved: ["implemented", "archived"],
  rejected: ["draft", "proposed", "archived"],
  implemented: ["archived"],
  archived: [],
};

function allowedNext(from: ChangeOrderStatus, to: ChangeOrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function toPublicDetail(row: ChangeOrderRow, events: import("./change-orders.types").ChangeOrderEventRow[]): ChangeOrderPublicDetail {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    description: row.description,
    schedule_impact_level: row.schedule_impact_level,
    schedule_impact_summary: row.schedule_impact_summary,
    schedule_delta_days: row.schedule_delta_days,
    has_linked_discussion: row.linked_discussion_id != null,
    has_linked_document: row.linked_document_id != null,
    has_linked_request: row.linked_request_id != null,
    has_linked_milestone: row.linked_milestone_id != null,
    implemented_at: row.implemented_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    events: events.map((e) => ({
      id: e.id,
      from_status: e.from_status,
      to_status: e.to_status,
      /** Transition notes are manager-only; status line remains auditable for stakeholders. */
      note: null,
      created_at: e.created_at,
    })),
  };
}

export async function listChangeOrders(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: Array<ChangeOrderListItem | ChangeOrderPublicListItem> | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadChangeOrders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const isMgr = await canManageChangeOrders(supabase, ctx, projectId);
  const rows = await repo.listByProject(supabase, projectId, ctx.tenantId, {
    excludeDraft: !isMgr,
  });
  if (!isMgr) {
    return {
      data: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        status: row.status,
        title: row.title,
        updated_at: row.updated_at,
      })),
      error: "",
    };
  }
  return { data: rows, error: "" };
}

export async function getChangeOrderDetail(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  changeOrderId: string
): Promise<{
  data: ChangeOrderDetailManager | ChangeOrderPublicDetail | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadChangeOrders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, changeOrderId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };
  const events = await repo.listEvents(supabase, changeOrderId, ctx.tenantId);
  const isMgr = await canManageChangeOrders(supabase, ctx, projectId);
  if (isMgr) {
    return {
      data: { ...row, events },
      error: "",
    };
  }
  if (row.status === "draft") return { data: null, error: "Not found" };
  return { data: toPublicDetail(row, events), error: "" };
}

export async function createChangeOrder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: {
    kind: ChangeOrderKind;
    title: string;
    description?: string | null;
    reason?: string | null;
    initial_status?: ChangeOrderStatus;
    schedule_impact_level?: ScheduleImpactLevel;
    budget_impact_level?: BudgetImpactLevel;
    schedule_impact_summary?: string | null;
    budget_impact_summary?: string | null;
    schedule_delta_days?: number | null;
    budget_delta_amount?: number | null;
    customer_amount_delta?: number | null;
    currency?: string | null;
    linked_discussion_id?: string | null;
    linked_document_id?: string | null;
    linked_request_id?: string | null;
    linked_milestone_id?: string | null;
    linked_customer_estimate_id?: string | null;
    internal_cost_item_id?: string | null;
  }
): Promise<{ data: ChangeOrderListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageChangeOrders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  if (!input.kind || !KINDS.includes(input.kind)) return { data: null, error: "Invalid kind" };
  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };
  const status = input.initial_status ?? "draft";
  if (!STATUSES.includes(status)) return { data: null, error: "Invalid status" };
  if (status !== "draft" && status !== "proposed") {
    return { data: null, error: "Create only supports draft or proposed" };
  }

  const sch = input.schedule_impact_level ?? "none";
  const bud = input.budget_impact_level ?? "none";
  if (!["none", "minor_shift", "deadline_shift", "major_shift"].includes(sch)) {
    return { data: null, error: "Invalid schedule impact" };
  }
  if (!["none", "minor_increase", "major_increase", "tbd"].includes(bud)) {
    return { data: null, error: "Invalid budget impact" };
  }

  const row = await repo.insertChangeOrder(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    kind: input.kind,
    status,
    title,
    description: input.description ?? null,
    reason: input.reason ?? null,
    schedule_impact_level: sch as ScheduleImpactLevel,
    budget_impact_level: bud as BudgetImpactLevel,
    schedule_impact_summary: input.schedule_impact_summary ?? null,
    budget_impact_summary: input.budget_impact_summary ?? null,
    schedule_delta_days: input.schedule_delta_days ?? null,
    budget_delta_amount: input.budget_delta_amount ?? null,
    customer_amount_delta: input.customer_amount_delta ?? null,
    currency: (input.currency?.trim() || "RUB"),
    linked_discussion_id: input.linked_discussion_id ?? null,
    linked_document_id: input.linked_document_id ?? null,
    linked_request_id: input.linked_request_id ?? null,
    linked_milestone_id: input.linked_milestone_id ?? null,
    linked_customer_estimate_id: input.linked_customer_estimate_id ?? null,
    internal_cost_item_id: input.internal_cost_item_id ?? null,
    created_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };

  if (status === "proposed") {
    await repo.insertEvent(supabase, {
      tenant_id: ctx.tenantId,
      project_id: projectId,
      change_order_id: row.id,
      from_status: null,
      to_status: "proposed",
      actor_user_id: ctx.userId,
      note: null,
    });
  }

  return {
    data: {
      id: row.id,
      kind: row.kind,
      status: row.status,
      title: row.title,
      schedule_impact_level: row.schedule_impact_level,
      budget_impact_level: row.budget_impact_level,
      updated_at: row.updated_at,
    },
    error: "",
  };
}

const EDITABLE: ChangeOrderStatus[] = ["draft", "proposed", "under_review"];

export async function updateChangeOrderContent(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  changeOrderId: string,
  input: Partial<{
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
  }>
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageChangeOrders(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, changeOrderId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { ok: false, error: "Not found" };
  if (!EDITABLE.includes(row.status)) {
    return { ok: false, error: "Change order is locked for content edits" };
  }

  const patch: Parameters<typeof repo.updateChangeOrder>[3] = {};
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 1) return { ok: false, error: "Title required" };
    patch.title = t;
  }
  if (input.description !== undefined) patch.description = input.description;
  if (input.reason !== undefined) patch.reason = input.reason;
  if (input.kind !== undefined) {
    if (!KINDS.includes(input.kind)) return { ok: false, error: "Invalid kind" };
    patch.kind = input.kind;
  }
  if (input.schedule_impact_level !== undefined) patch.schedule_impact_level = input.schedule_impact_level;
  if (input.budget_impact_level !== undefined) patch.budget_impact_level = input.budget_impact_level;
  if (input.schedule_impact_summary !== undefined) patch.schedule_impact_summary = input.schedule_impact_summary;
  if (input.budget_impact_summary !== undefined) patch.budget_impact_summary = input.budget_impact_summary;
  if (input.schedule_delta_days !== undefined) patch.schedule_delta_days = input.schedule_delta_days;
  if (input.budget_delta_amount !== undefined) patch.budget_delta_amount = input.budget_delta_amount;
  if (input.customer_amount_delta !== undefined) patch.customer_amount_delta = input.customer_amount_delta;
  if (input.currency !== undefined) {
    const c = input.currency.trim();
    if (c.length < 1) return { ok: false, error: "Currency required" };
    patch.currency = c;
  }
  if (input.linked_discussion_id !== undefined) patch.linked_discussion_id = input.linked_discussion_id;
  if (input.linked_document_id !== undefined) patch.linked_document_id = input.linked_document_id;
  if (input.linked_request_id !== undefined) patch.linked_request_id = input.linked_request_id;
  if (input.linked_milestone_id !== undefined) patch.linked_milestone_id = input.linked_milestone_id;
  if (input.linked_customer_estimate_id !== undefined)
    patch.linked_customer_estimate_id = input.linked_customer_estimate_id;
  if (input.internal_cost_item_id !== undefined) patch.internal_cost_item_id = input.internal_cost_item_id;

  const ok = await repo.updateChangeOrder(supabase, changeOrderId, ctx.tenantId, patch);
  return ok ? { ok: true, error: "" } : { ok: false, error: "Update failed" };
}

export async function transitionChangeOrder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  changeOrderId: string,
  toStatus: ChangeOrderStatus,
  note?: string | null
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageChangeOrders(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  if (!STATUSES.includes(toStatus)) return { ok: false, error: "Invalid status" };
  const row = await repo.getById(supabase, changeOrderId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { ok: false, error: "Not found" };
  const from = row.status;
  if (!allowedNext(from, toStatus)) return { ok: false, error: "Transition not allowed" };

  const patch: Parameters<typeof repo.updateChangeOrder>[3] = { status: toStatus };
  const now = new Date().toISOString();
  if (toStatus === "implemented") {
    patch.implemented_at = now;
    patch.implemented_by = ctx.userId;
  }

  const ok = await repo.updateChangeOrder(supabase, changeOrderId, ctx.tenantId, patch);
  if (!ok) return { ok: false, error: "Update failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    change_order_id: changeOrderId,
    from_status: from,
    to_status: toStatus,
    actor_user_id: ctx.userId,
    note: note ?? null,
  });

  return { ok: true, error: "" };
}

/**
 * Portal stakeholder approves or rejects a change order awaiting customer decision.
 * Managers must use {@link transitionChangeOrder} instead.
 */
export async function respondToChangeOrderByCustomer(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  changeOrderId: string,
  decision: "approve" | "reject"
): Promise<{ data: ChangeOrderPublicDetail | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadChangeOrders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  if (await canManageChangeOrders(supabase, ctx, projectId)) {
    return { data: null, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, changeOrderId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };
  if (row.status === "draft") return { data: null, error: "Not found" };

  const from = row.status;
  const toStatus: ChangeOrderStatus = decision === "approve" ? "approved" : "rejected";
  if (!allowedNext(from, toStatus)) {
    return { data: null, error: "Customer response not allowed for this status" };
  }

  const now = new Date().toISOString();
  const ok = await repo.updateChangeOrder(supabase, changeOrderId, ctx.tenantId, {
    status: toStatus,
    approved_by_customer: ctx.userId,
    approved_at: now,
  });
  if (!ok) return { data: null, error: "Update failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    change_order_id: changeOrderId,
    from_status: from,
    to_status: toStatus,
    actor_user_id: ctx.userId,
    note: decision === "approve" ? "Customer approved" : "Customer rejected",
  });

  const fresh = await repo.getById(supabase, changeOrderId, ctx.tenantId);
  if (!fresh) return { data: null, error: "Not found" };
  const events = await repo.listEvents(supabase, changeOrderId, ctx.tenantId);
  return { data: toPublicDetail(fresh, events), error: "" };
}
