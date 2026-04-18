import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import type {
  CommercialItemRow,
  CommercialItemStatus,
  CreateCommercialItemInput,
  UpdateCommercialItemInput,
} from "./commercial.types";
import {
  getCommercialItemById,
  insertCommercialItemEvent,
  listCommercialItemsForProject,
} from "./commercial.repository";
import { canManageCommercialItems, canReadCommercialItems } from "./commercial.policy";

const TRANSITIONS: Record<CommercialItemStatus, CommercialItemStatus[]> = {
  draft: ["issued", "cancelled"],
  issued: ["due", "overdue", "paid", "cancelled"],
  due: ["overdue", "paid", "cancelled"],
  overdue: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

export function canTransitionCommercialStatus(from: CommercialItemStatus, to: CommercialItemStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

async function verifyChangeOrderInProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  changeOrderId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("project_change_orders")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("id", changeOrderId)
    .maybeSingle();
  return !error && !!data;
}

async function verifyDocumentInProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  documentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();
  return !error && !!data;
}

export async function createCommercialItem(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: CreateCommercialItemInput
): Promise<{ data: CommercialItemRow | null; error: string | null }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  const can = await canManageCommercialItems(supabase, ctx, projectId);
  if (!can) return { data: null, error: "Insufficient rights" };

  if (!input.title?.trim() || !Number.isFinite(input.amount)) {
    return { data: null, error: "title and valid amount are required" };
  }

  if (input.linked_change_order_id) {
    const ok = await verifyChangeOrderInProject(supabase, ctx.tenantId, projectId, input.linked_change_order_id);
    if (!ok) return { data: null, error: "Invalid change order for this project" };
  }
  if (input.linked_document_id) {
    const ok = await verifyDocumentInProject(supabase, ctx.tenantId, projectId, input.linked_document_id);
    if (!ok) return { data: null, error: "Invalid document for this project" };
  }

  const currency = (input.currency ?? "RUB").trim() || "RUB";

  const { data: inserted, error: insErr } = await supabase
    .from("project_commercial_items")
    .insert({
      tenant_id: ctx.tenantId,
      project_id: projectId,
      kind: input.kind,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      amount: input.amount,
      currency,
      due_date: input.due_date ?? null,
      status: "draft",
      linked_change_order_id: input.linked_change_order_id ?? null,
      linked_document_id: input.linked_document_id ?? null,
      created_by: ctx.userId,
    })
    .select(
      "id, tenant_id, project_id, kind, title, description, amount, currency, due_date, status, paid_at, linked_change_order_id, linked_document_id, created_by, created_at, updated_at"
    )
    .single();

  if (insErr || !inserted) {
    return { data: null, error: insErr?.message ?? "Failed to create commercial item" };
  }

  const row = inserted as CommercialItemRow;
  await insertCommercialItemEvent(supabase, ctx.tenantId, projectId, row.id, {
    event_kind: "created",
    to_status: "draft",
    actor_user_id: ctx.userId,
    note: null,
  });

  return { data: row, error: null };
}

export async function updateCommercialItem(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  itemId: string,
  input: UpdateCommercialItemInput
): Promise<{ data: CommercialItemRow | null; error: string | null }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  const can = await canManageCommercialItems(supabase, ctx, projectId);
  if (!can) return { data: null, error: "Insufficient rights" };

  const existing = await getCommercialItemById(supabase, ctx.tenantId, projectId, itemId);
  if (!existing) return { data: null, error: "Not found" };

  if (input.linked_change_order_id !== undefined && input.linked_change_order_id !== null) {
    const ok = await verifyChangeOrderInProject(supabase, ctx.tenantId, projectId, input.linked_change_order_id);
    if (!ok) return { data: null, error: "Invalid change order for this project" };
  }
  if (input.linked_document_id !== undefined && input.linked_document_id !== null) {
    const ok = await verifyDocumentInProject(supabase, ctx.tenantId, projectId, input.linked_document_id);
    if (!ok) return { data: null, error: "Invalid document for this project" };
  }

  const patch: Record<string, unknown> = {};
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() ?? null;
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.currency !== undefined) patch.currency = input.currency.trim() || "RUB";
  if (input.due_date !== undefined) patch.due_date = input.due_date;
  if (input.linked_change_order_id !== undefined) patch.linked_change_order_id = input.linked_change_order_id;
  if (input.linked_document_id !== undefined) patch.linked_document_id = input.linked_document_id;

  if (input.status !== undefined) {
    if (!canTransitionCommercialStatus(existing.status, input.status)) {
      return { data: null, error: `Invalid status transition: ${existing.status} → ${input.status}` };
    }
    if (input.status === "paid") {
      patch.paid_at = input.paid_at ?? new Date().toISOString();
      patch.status = "paid";
    } else {
      patch.status = input.status;
      patch.paid_at = input.paid_at ?? null;
    }

    await insertCommercialItemEvent(supabase, ctx.tenantId, projectId, itemId, {
      event_kind: "status_change",
      from_status: existing.status,
      to_status: input.status,
      actor_user_id: ctx.userId,
      note: null,
    });

  } else if (input.paid_at !== undefined) {
    patch.paid_at = input.paid_at;
  }

  if (Object.keys(patch).length > 0) {
    const { error: upErr } = await supabase
      .from("project_commercial_items")
      .update(patch)
      .eq("id", itemId)
      .eq("tenant_id", ctx.tenantId)
      .eq("project_id", projectId);
    if (upErr) return { data: null, error: upErr.message };
  }

  const full = await getCommercialItemById(supabase, ctx.tenantId, projectId, itemId);
  return { data: full, error: null };
}

export async function listCommercialItems(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: CommercialItemRow[]; error: string | null }> {
  if (!ctx.tenantId) return { data: [], error: "Tenant required" };
  const can = await canReadCommercialItems(supabase, ctx, projectId);
  if (!can) return { data: [], error: "Insufficient rights" };
  const rows = await listCommercialItemsForProject(supabase, ctx.tenantId, projectId);
  return { data: rows, error: null };
}

export async function getCommercialItem(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  itemId: string
): Promise<{ data: CommercialItemRow | null; error: string | null }> {
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  const can = await canReadCommercialItems(supabase, ctx, projectId);
  if (!can) return { data: null, error: "Insufficient rights" };
  const row = await getCommercialItemById(supabase, ctx.tenantId, projectId, itemId);
  return { data: row, error: row ? null : "Not found" };
}
