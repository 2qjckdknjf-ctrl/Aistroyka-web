import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as docRepo from "@/lib/domain/documents/document.repository";
import * as milestoneRepo from "@/lib/domain/milestones/milestone.repository";
import { getAdminClient } from "@/lib/supabase/admin";
import * as repo from "./client-requests.repository";
import {
  canManageClientRequests,
  canStakeholderAccessClientRequests,
  canRespondToClientRequests,
} from "./client-requests.policy";
import type {
  ClientRequestManager,
  ClientRequestPublic,
  CreateClientRequestInput,
  ManagerPatchClientRequest,
  ProjectClientRequestRow,
  RespondToClientRequestInput,
  ClientRequestEventPublic,
  ClientRequestDecisionType,
  ClientRequestPriority,
} from "./client-requests.types";

function normalizeChoiceOptions(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const out = raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return out.length ? out : null;
}

export function rowToPublic(r: ProjectClientRequestRow): ClientRequestPublic {
  return {
    id: r.id,
    kind: r.kind,
    action_mode: r.action_mode,
    status: r.status,
    title: r.title,
    instructions: r.instructions,
    choice_options: normalizeChoiceOptions(r.choice_options),
    linked_entity_type: r.linked_entity_type,
    linked_entity_id: r.linked_entity_id,
    decision_type: r.decision_type,
    priority: r.priority,
    due_at: r.due_at,
    customer_visible_amount:
      r.customer_visible_amount != null ? Number(r.customer_visible_amount) : null,
    customer_visible_currency: r.customer_visible_currency,
    requested_at: r.requested_at,
    responded_at: r.responded_at,
    response_value: r.response_value,
    response_note: r.response_note,
    completed_at: r.completed_at,
  };
}

export function rowToManager(r: ProjectClientRequestRow): ClientRequestManager {
  return {
    ...rowToPublic(r),
    requested_by: r.requested_by,
    responded_by: r.responded_by,
    cancelled_by: r.cancelled_by,
    completed_by: r.completed_by,
    cancelled_at: r.cancelled_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function canCompleteRow(r: ProjectClientRequestRow): boolean {
  if (r.status === "completed" || r.status === "cancelled") return false;
  if (r.action_mode === "info_only") return r.status === "open";
  return r.status === "responded";
}

function canCancelRow(r: ProjectClientRequestRow): boolean {
  return r.status === "open" || r.status === "responded";
}

async function validateLinkedEntity(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  linked_type: "document" | "milestone" | null,
  linked_id: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((linked_type == null) !== (linked_id == null)) {
    return { ok: false, error: "linked_entity_type and linked_entity_id must both be set or both omitted" };
  }
  if (!linked_type || !linked_id) return { ok: true };
  if (linked_type === "document") {
    const d = await docRepo.getById(supabase, linked_id, tenantId);
    if (!d || d.project_id !== projectId) return { ok: false, error: "Document not found for project" };
    return { ok: true };
  }
  const m = await milestoneRepo.getById(supabase, linked_id, tenantId);
  if (!m || m.project_id !== projectId) return { ok: false, error: "Milestone not found for project" };
  return { ok: true };
}

const KINDS: CreateClientRequestInput["kind"][] = [
  "approve_or_reject",
  "feedback",
  "acknowledge",
  "choice",
  "document_review",
];

const DECISION_TYPES: ClientRequestDecisionType[] = [
  "design_choice",
  "material_choice",
  "estimate_approval",
  "cost_change_customer_facing",
  "schedule_change",
  "document_approval",
  "work_acceptance",
  "general_question",
  "other",
];

const PRIORITIES: ClientRequestPriority[] = ["low", "medium", "high", "critical"];

export async function createClientRequest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: CreateClientRequestInput
): Promise<{ data: ClientRequestManager | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageClientRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  if (!input.kind || !KINDS.includes(input.kind)) return { data: null, error: "Invalid kind" };
  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };
  const action_mode = input.action_mode ?? "action_required";
  const choice_options = normalizeChoiceOptions(input.choice_options);
  if (input.kind === "choice" && (!choice_options || choice_options.length < 2)) {
    return { data: null, error: "choice requires at least two options" };
  }
  if (input.kind !== "choice" && choice_options && choice_options.length > 0) {
    return { data: null, error: "choice_options only valid for kind choice" };
  }

  if (input.decision_type != null && !DECISION_TYPES.includes(input.decision_type)) {
    return { data: null, error: "Invalid decision_type" };
  }
  const priority: ClientRequestPriority = input.priority ?? "medium";
  if (!PRIORITIES.includes(priority)) return { data: null, error: "Invalid priority" };

  const customerAmt = input.customer_visible_amount;
  if (customerAmt != null) {
    if (!Number.isFinite(customerAmt) || customerAmt < 0) {
      return { data: null, error: "Invalid customer_visible_amount" };
    }
    if (input.decision_type !== "estimate_approval" && input.decision_type !== "cost_change_customer_facing") {
      return {
        data: null,
        error: "customer_visible_amount requires estimate_approval or cost_change_customer_facing decision_type",
      };
    }
  }

  const linked = await validateLinkedEntity(
    supabase,
    ctx.tenantId,
    projectId,
    input.linked_entity_type ?? null,
    input.linked_entity_id ?? null
  );
  if (!linked.ok) return { data: null, error: linked.error };

  const row = await repo.insertRequest(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    kind: input.kind,
    action_mode,
    title,
    instructions: input.instructions?.trim() ?? null,
    choice_options: input.kind === "choice" ? choice_options : null,
    linked_entity_type: input.linked_entity_type ?? null,
    linked_entity_id: input.linked_entity_id ?? null,
    decision_type: input.decision_type ?? null,
    priority,
    assigned_to: input.assigned_to ?? null,
    due_at: input.due_at ?? null,
    customer_visible_amount: customerAmt ?? null,
    customer_visible_currency: input.customer_visible_currency?.trim() || null,
    requested_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    request_id: row.id,
    actor_user_id: ctx.userId,
    event_type: "created",
    payload: { kind: row.kind, action_mode: row.action_mode, decision_type: row.decision_type ?? null },
  });

  return { data: rowToManager(row), error: "" };
}

export async function listClientRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  opts?: { status?: string; viewer: "manager" | "stakeholder" }
): Promise<{ data: ClientRequestManager[] | ClientRequestPublic[] | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  const asManager = opts?.viewer === "manager";
  const asStakeholder = opts?.viewer === "stakeholder";

  if (asManager) {
    if (!(await canManageClientRequests(supabase, ctx, projectId))) {
      return { data: null, error: "Insufficient rights" };
    }
  } else if (asStakeholder) {
    if (!(await canStakeholderAccessClientRequests(supabase, ctx, projectId))) {
      return { data: null, error: "Insufficient rights" };
    }
  } else {
    return { data: null, error: "Invalid viewer" };
  }

  const statusFilter =
    opts?.status === "all" || opts?.status == null || opts?.status === ""
      ? undefined
      : (opts.status as "open" | "responded" | "completed" | "cancelled");

  const rows = await repo.listByProject(supabase, projectId, ctx.tenantId, {
    status: statusFilter ?? "all",
  });

  if (asManager) {
    return { data: rows.map(rowToManager), error: "" };
  }
  return { data: rows.map(rowToPublic), error: "" };
}

export async function getClientRequest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  requestId: string,
  viewer: "manager" | "stakeholder"
): Promise<{
  data: (ClientRequestManager & { history?: ClientRequestEventPublic[] }) | ClientRequestPublic | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  if (viewer === "manager") {
    if (!(await canManageClientRequests(supabase, ctx, projectId))) {
      return { data: null, error: "Insufficient rights" };
    }
  } else if (!(await canStakeholderAccessClientRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const row = await repo.getById(supabase, requestId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };

  if (viewer === "stakeholder") {
    return { data: rowToPublic(row), error: "" };
  }

  const events = await repo.listEventsByRequest(supabase, requestId, ctx.tenantId);
  const history: ClientRequestEventPublic[] = events.map((e) => ({
    id: e.id,
    event_type: e.event_type,
    created_at: e.created_at,
    payload: e.payload,
  }));

  return { data: { ...rowToManager(row), history }, error: "" };
}

function validateResponse(
  kind: ProjectClientRequestRow["kind"],
  body: RespondToClientRequestInput
): { ok: true; value: string; note: string | null } | { ok: false; error: string } {
  const note = body.note?.trim() || null;
  switch (kind) {
    case "approve_or_reject": {
      if (body.decision !== "approve" && body.decision !== "reject") {
        return { ok: false, error: "decision must be approve or reject" };
      }
      return { ok: true, value: body.decision, note };
    }
    case "feedback": {
      const t = body.feedback_text?.trim() ?? "";
      if (t.length < 1) return { ok: false, error: "feedback_text required" };
      return { ok: true, value: t, note };
    }
    case "acknowledge": {
      if (body.acknowledged !== true) return { ok: false, error: "acknowledged must be true" };
      return { ok: true, value: "acknowledged", note };
    }
    case "choice": {
      if (typeof body.choice_index !== "number" || body.choice_index < 0 || !Number.isInteger(body.choice_index)) {
        return { ok: false, error: "choice_index required" };
      }
      return { ok: true, value: String(body.choice_index), note };
    }
    case "document_review": {
      if (body.document_review_confirmed !== true) {
        return { ok: false, error: "document_review_confirmed must be true" };
      }
      return { ok: true, value: "reviewed", note };
    }
    default:
      return { ok: false, error: "Unknown kind" };
  }
}

export async function respondToClientRequest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  requestId: string,
  body: RespondToClientRequestInput
): Promise<{ data: ClientRequestPublic | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canRespondToClientRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const row = await repo.getById(supabase, requestId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };
  if (row.status !== "open") return { data: null, error: "Request is not open" };
  if (row.action_mode === "info_only") {
    return { data: null, error: "This request does not require a response" };
  }

  const validated = validateResponse(row.kind, body);
  if (!validated.ok) return { data: null, error: validated.error };

  if (row.kind === "choice") {
    const options = normalizeChoiceOptions(row.choice_options);
    const idx = Number.parseInt(validated.value, 10);
    if (!options || idx < 0 || idx >= options.length) {
      return { data: null, error: "Invalid choice_index" };
    }
  }

  // Portal decision-makers pass app authz but RLS only allows UPDATE/INSERT for
  // internal tenant readers — write via service role after the gate above.
  const writer = getAdminClient() ?? supabase;
  const updated = await repo.updateRequest(writer, requestId, ctx.tenantId, {
    status: "responded",
    responded_at: new Date().toISOString(),
    responded_by: ctx.userId,
    response_value: validated.value,
    response_note: validated.note,
  });
  if (!updated) return { data: null, error: "Update failed" };

  await repo.insertEvent(writer, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    request_id: requestId,
    actor_user_id: ctx.userId,
    event_type: "responded",
    payload: { kind: row.kind, response_value: validated.value },
  });

  return { data: rowToPublic(updated), error: "" };
}

export async function patchClientRequestByManager(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  requestId: string,
  patch: ManagerPatchClientRequest
): Promise<{ data: ClientRequestManager | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageClientRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const row = await repo.getById(supabase, requestId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };

  if (patch.status === "cancelled") {
    if (!canCancelRow(row)) return { data: null, error: "Cannot cancel in current status" };
    const updated = await repo.updateRequest(supabase, requestId, ctx.tenantId, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: ctx.userId,
    });
    if (!updated) return { data: null, error: "Update failed" };
    await repo.insertEvent(supabase, {
      tenant_id: ctx.tenantId,
      project_id: projectId,
      request_id: requestId,
      actor_user_id: ctx.userId,
      event_type: "cancelled",
      payload: { prior_status: row.status },
    });
    return { data: rowToManager(updated), error: "" };
  }

  if (patch.status === "completed") {
    if (!canCompleteRow(row)) return { data: null, error: "Cannot complete in current status" };
    const updated = await repo.updateRequest(supabase, requestId, ctx.tenantId, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: ctx.userId,
    });
    if (!updated) return { data: null, error: "Update failed" };
    await repo.insertEvent(supabase, {
      tenant_id: ctx.tenantId,
      project_id: projectId,
      request_id: requestId,
      actor_user_id: ctx.userId,
      event_type: "completed",
      payload: { prior_status: row.status },
    });
    return { data: rowToManager(updated), error: "" };
  }

  return { data: null, error: "Invalid patch" };
}
