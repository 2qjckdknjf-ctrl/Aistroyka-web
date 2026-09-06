import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { canManageClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import { canReadClientPortalView, canRespondToClientRequests } from "@/lib/domain/stakeholders/stakeholders.policy";
import { createClientRequest, respondToClientRequest } from "@/lib/domain/client-requests/client-requests.service";
import type {
  CreateCustomerEstimateInput,
  CustomerEstimatePublic,
  CustomerEstimateRow,
  CustomerEstimateStatus,
  PatchCustomerEstimateInput,
} from "./customer-estimates.types";

const ROW_SELECT =
  "id, tenant_id, project_id, title, description, status, total_amount, currency, valid_until, created_by, sent_to_customer_at, approved_by_customer_at, rejected_by_customer_at, customer_note, linked_document_id, linked_decision_request_id, created_at, updated_at";

function toPublic(row: CustomerEstimateRow): CustomerEstimatePublic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    total_amount: Number(row.total_amount),
    currency: row.currency,
    valid_until: row.valid_until,
    sent_to_customer_at: row.sent_to_customer_at,
    approved_by_customer_at: row.approved_by_customer_at,
    rejected_by_customer_at: row.rejected_by_customer_at,
    customer_note: row.customer_note,
    linked_document_id: row.linked_document_id,
    linked_decision_request_id: row.linked_decision_request_id,
  };
}

async function canManageEstimate(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  return canManageClientRequests(supabase, ctx, projectId);
}

export async function patchCustomerEstimate(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  estimateId: string,
  patch: PatchCustomerEstimateInput
): Promise<{ data: CustomerEstimateRow | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageEstimate(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const { data: existing } = await supabase
    .from("customer_estimates")
    .select(ROW_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .eq("id", estimateId)
    .maybeSingle();
  const row = existing as CustomerEstimateRow | null;
  if (!row) return { data: null, error: "Not found" };

  if (patch.status === "cancelled") {
    if (row.status !== "draft") return { data: null, error: "Only draft estimates can be cancelled" };
    const { data, error } = await supabase
      .from("customer_estimates")
      .update({ status: "cancelled" })
      .eq("id", estimateId)
      .eq("tenant_id", ctx.tenantId)
      .select(ROW_SELECT)
      .single();
    if (error || !data) return { data: null, error: error?.message ?? "Update failed" };
    return { data: data as CustomerEstimateRow, error: "" };
  }

  if (row.status !== "draft") return { data: null, error: "Only draft estimates can be edited" };

  const updates: Record<string, string | number | null> = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { data: null, error: "title cannot be empty" };
    updates.title = t;
  }
  if (patch.description !== undefined) updates.description = patch.description?.trim() || null;
  if (patch.total_amount !== undefined) {
    if (!Number.isFinite(patch.total_amount) || patch.total_amount < 0) {
      return { data: null, error: "Invalid total_amount" };
    }
    updates.total_amount = patch.total_amount;
  }
  if (patch.currency !== undefined) updates.currency = patch.currency.trim() || "RUB";
  if (patch.valid_until !== undefined) updates.valid_until = patch.valid_until;
  if (patch.linked_document_id !== undefined) updates.linked_document_id = patch.linked_document_id;

  if (Object.keys(updates).length === 0) return { data: row, error: "" };

  const { data, error } = await supabase
    .from("customer_estimates")
    .update(updates)
    .eq("id", estimateId)
    .eq("tenant_id", ctx.tenantId)
    .select(ROW_SELECT)
    .single();
  if (error || !data) return { data: null, error: error?.message ?? "Update failed" };
  return { data: data as CustomerEstimateRow, error: "" };
}

export async function createCustomerEstimate(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: CreateCustomerEstimateInput
): Promise<{ data: CustomerEstimateRow | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageEstimate(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const title = input.title.trim();
  if (!title || !Number.isFinite(input.total_amount) || input.total_amount < 0) {
    return { data: null, error: "title and valid total_amount are required" };
  }
  const { data, error } = await supabase
    .from("customer_estimates")
    .insert({
      tenant_id: ctx.tenantId,
      project_id: projectId,
      title,
      description: input.description?.trim() || null,
      total_amount: input.total_amount,
      currency: input.currency?.trim() || "RUB",
      valid_until: input.valid_until ?? null,
      linked_document_id: input.linked_document_id ?? null,
      created_by: ctx.userId,
    })
    .select(ROW_SELECT)
    .single();
  if (error || !data) return { data: null, error: error?.message ?? "Create failed" };
  return { data: data as CustomerEstimateRow, error: "" };
}

export async function listCustomerEstimates(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  viewer: "manager" | "customer"
): Promise<{ data: Array<CustomerEstimateRow | CustomerEstimatePublic>; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: [], error: "Tenant required" };
  if (viewer === "manager") {
    if (!(await canManageEstimate(supabase, ctx, projectId))) {
      return { data: [], error: "Insufficient rights" };
    }
  } else if (!(await canReadClientPortalView(supabase, ctx, projectId))) {
    return { data: [], error: "Insufficient rights" };
  }
  let q = supabase
    .from("customer_estimates")
    .select(ROW_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (viewer === "customer") q = q.in("status", ["sent", "approved", "rejected", "expired"]);
  const { data, error } = await q;
  if (error) return { data: [], error: error.message };
  const rows = (data ?? []) as CustomerEstimateRow[];
  return { data: viewer === "customer" ? rows.map(toPublic) : rows, error: "" };
}

export async function sendCustomerEstimate(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  estimateId: string
): Promise<{ data: CustomerEstimateRow | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageEstimate(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const { data: existing } = await supabase
    .from("customer_estimates")
    .select(ROW_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .eq("id", estimateId)
    .maybeSingle();
  const row = existing as CustomerEstimateRow | null;
  if (!row) return { data: null, error: "Not found" };
  if (row.status !== "draft") return { data: null, error: "Only draft estimates can be sent" };

  const decision = await createClientRequest(supabase, ctx, projectId, {
    kind: "approve_or_reject",
    decision_type: "estimate_approval",
    priority: "high",
    title: row.title,
    instructions: row.description,
    linked_entity_type: row.linked_document_id ? "document" : null,
    linked_entity_id: row.linked_document_id,
    customer_visible_amount: Number(row.total_amount),
    customer_visible_currency: row.currency,
  });
  if (!decision.data) return { data: null, error: decision.error || "Decision request failed" };

  const { data, error } = await supabase
    .from("customer_estimates")
    .update({
      status: "sent",
      sent_to_customer_at: new Date().toISOString(),
      linked_decision_request_id: decision.data.id,
    })
    .eq("id", estimateId)
    .eq("tenant_id", ctx.tenantId)
    .select(ROW_SELECT)
    .single();
  if (error || !data) return { data: null, error: error?.message ?? "Send failed" };
  return { data: data as CustomerEstimateRow, error: "" };
}

export async function respondToCustomerEstimate(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  estimateId: string,
  decision: "approve" | "reject",
  note: string | null
): Promise<{ data: CustomerEstimatePublic | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canRespondToClientRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const { data: existing } = await supabase
    .from("customer_estimates")
    .select(ROW_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .eq("id", estimateId)
    .maybeSingle();
  const row = existing as CustomerEstimateRow | null;
  if (!row) return { data: null, error: "Not found" };
  if (row.status !== "sent") return { data: null, error: "Estimate is not awaiting response" };

  if (row.linked_decision_request_id) {
    const dec = await respondToClientRequest(supabase, ctx, projectId, row.linked_decision_request_id, {
      decision,
      note,
    });
    if (dec.error || !dec.data) return { data: null, error: dec.error || "Decision respond failed" };
  }

  // Customer decision outcomes are protected by a DB trigger and must be written
  // through the server/service role after portal authorization succeeds.
  const writer = getAdminClient() ?? supabase;
  const nextStatus: CustomerEstimateStatus = decision === "approve" ? "approved" : "rejected";
  const now = new Date().toISOString();
  const { data, error } = await writer
    .from("customer_estimates")
    .update({
      status: nextStatus,
      approved_by_customer_at: decision === "approve" ? now : null,
      rejected_by_customer_at: decision === "reject" ? now : null,
      customer_note: note,
    })
    .eq("id", estimateId)
    .eq("tenant_id", ctx.tenantId)
    .select(ROW_SELECT)
    .single();
  if (error || !data) return { data: null, error: error?.message ?? "Respond failed" };
  const updated = data as CustomerEstimateRow;

  if (decision === "approve") {
    await writer.from("project_commercial_items").insert({
      tenant_id: ctx.tenantId,
      project_id: projectId,
      kind: "expected_revenue",
      title: updated.title,
      description: updated.description,
      amount: updated.total_amount,
      currency: updated.currency,
      due_date: updated.valid_until,
      status: "issued",
      linked_document_id: updated.linked_document_id,
      created_by: updated.created_by ?? ctx.userId,
    });
  }

  return { data: toPublic(updated), error: "" };
}
