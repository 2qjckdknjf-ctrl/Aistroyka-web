import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getByProject } from "@/lib/domain/project-handover/project-handover.repository";
import * as repo from "./aftercare.repository";
import {
  canManageAftercareRequests,
  canReadAftercareRequests,
  canReportAftercareAsStakeholder,
} from "./aftercare.policy";
import type {
  ServiceRequestCoverageType,
  ServiceRequestEventRow,
  ServiceRequestListItem,
  ServiceRequestPublicDetail,
  ServiceRequestRow,
  ServiceRequestStatus,
} from "./aftercare.types";

const STATUSES: ServiceRequestStatus[] = [
  "reported",
  "triaged",
  "in_progress",
  "resolved",
  "closed",
];

const COVERAGE: ServiceRequestCoverageType[] = [
  "warranty_covered",
  "warranty_review_needed",
  "not_warranty",
];

const TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  reported: ["triaged", "in_progress", "closed"],
  triaged: ["in_progress", "closed"],
  in_progress: ["resolved", "triaged", "closed"],
  resolved: ["closed"],
  closed: [],
};

function allowed(from: ServiceRequestStatus, to: ServiceRequestStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function toPublicDetail(row: ServiceRequestRow): ServiceRequestPublicDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    coverage_type: row.coverage_type,
    due_date: row.due_date,
    resolution_note: row.resolution_note,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    linked_defect_id: row.linked_defect_id,
    linked_discussion_id: row.linked_discussion_id,
  };
}

async function requirePostHandover(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<{ ok: true; handoverId: string } | { ok: false; error: string }> {
  const h = await getByProject(supabase, projectId, tenantId);
  if (!h) {
    return {
      ok: false,
      error: "Handover record is required before aftercare. Complete handover on this project first.",
    };
  }
  if (h.status !== "handed_over" && h.status !== "completed") {
    return {
      ok: false,
      error: "Aftercare is available only after handover or project completion.",
    };
  }
  return { ok: true, handoverId: h.id };
}

export async function listServiceRequests(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ServiceRequestListItem[] | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadAftercareRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const rows = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data: rows, error: "" };
}

export async function getServiceRequestDetail(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  requestId: string
): Promise<{
  data: (ServiceRequestRow & { events: ServiceRequestEventRow[] }) | ServiceRequestPublicDetail | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadAftercareRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, requestId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };
  const isMgr = await canManageAftercareRequests(supabase, ctx, projectId);
  if (isMgr) {
    const events = await repo.listEvents(supabase, requestId, ctx.tenantId);
    return { data: { ...row, events }, error: "" };
  }
  return { data: toPublicDetail(row), error: "" };
}

export async function createServiceRequestManager(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: {
    title: string;
    description?: string | null;
    coverage_type?: ServiceRequestCoverageType;
    assigned_to?: string | null;
    due_date?: string | null;
    linked_defect_id?: string | null;
    linked_discussion_id?: string | null;
    initial_status?: ServiceRequestStatus;
  }
): Promise<{ data: ServiceRequestListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageAftercareRequests(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const gate = await requirePostHandover(supabase, projectId, ctx.tenantId);
  if (!gate.ok) return { data: null, error: gate.error };

  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };
  const status = input.initial_status ?? "reported";
  if (!STATUSES.includes(status)) return { data: null, error: "Invalid status" };
  if (!["reported", "triaged", "in_progress"].includes(status)) {
    return { data: null, error: "Create only supports reported, triaged, or in_progress" };
  }
  const coverage = input.coverage_type ?? "warranty_review_needed";
  if (!COVERAGE.includes(coverage)) return { data: null, error: "Invalid coverage" };

  const row = await repo.insertServiceRequest(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    title,
    description: input.description ?? null,
    status,
    coverage_type: coverage,
    assigned_to: input.assigned_to ?? null,
    due_date: input.due_date ?? null,
    linked_handover_id: gate.handoverId,
    linked_defect_id: input.linked_defect_id ?? null,
    linked_discussion_id: input.linked_discussion_id ?? null,
    created_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    service_request_id: row.id,
    from_status: null,
    to_status: status,
    actor_user_id: ctx.userId,
    note: null,
  });

  return {
    data: {
      id: row.id,
      title: row.title,
      status: row.status,
      coverage_type: row.coverage_type,
      due_date: row.due_date,
      updated_at: row.updated_at,
    },
    error: "",
  };
}

export async function createServiceRequestStakeholder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: { title: string; description?: string | null }
): Promise<{ data: ServiceRequestListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReportAftercareAsStakeholder(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const gate = await requirePostHandover(supabase, projectId, ctx.tenantId);
  if (!gate.ok) return { data: null, error: gate.error };

  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };

  const row = await repo.insertServiceRequest(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    title,
    description: input.description ?? null,
    status: "reported",
    coverage_type: "warranty_review_needed",
    assigned_to: null,
    due_date: null,
    linked_handover_id: gate.handoverId,
    linked_defect_id: null,
    linked_discussion_id: null,
    created_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    service_request_id: row.id,
    from_status: null,
    to_status: "reported",
    actor_user_id: ctx.userId,
    note: null,
  });

  return {
    data: {
      id: row.id,
      title: row.title,
      status: row.status,
      coverage_type: row.coverage_type,
      due_date: row.due_date,
      updated_at: row.updated_at,
    },
    error: "",
  };
}

export async function patchServiceRequestManager(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  requestId: string,
  input: Partial<{
    title: string;
    description: string | null;
    coverage_type: ServiceRequestCoverageType;
    assigned_to: string | null;
    due_date: string | null;
    linked_handover_id: string | null;
    linked_defect_id: string | null;
    linked_discussion_id: string | null;
  }>
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageAftercareRequests(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, requestId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { ok: false, error: "Not found" };
  if (row.status === "closed") return { ok: false, error: "Request is closed" };

  const patch: Parameters<typeof repo.updateServiceRequest>[3] = {};
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 1) return { ok: false, error: "Title required" };
    patch.title = t;
  }
  if (input.description !== undefined) patch.description = input.description;
  if (input.coverage_type !== undefined) {
    if (!COVERAGE.includes(input.coverage_type)) return { ok: false, error: "Invalid coverage" };
    patch.coverage_type = input.coverage_type;
  }
  if (input.assigned_to !== undefined) patch.assigned_to = input.assigned_to;
  if (input.due_date !== undefined) patch.due_date = input.due_date;
  if (input.linked_handover_id !== undefined) patch.linked_handover_id = input.linked_handover_id;
  if (input.linked_defect_id !== undefined) patch.linked_defect_id = input.linked_defect_id;
  if (input.linked_discussion_id !== undefined) patch.linked_discussion_id = input.linked_discussion_id;

  const ok = await repo.updateServiceRequest(supabase, requestId, ctx.tenantId, patch);
  return ok ? { ok: true, error: "" } : { ok: false, error: "Update failed" };
}

export async function transitionServiceRequest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  requestId: string,
  toStatus: ServiceRequestStatus,
  note?: string | null,
  resolutionNote?: string | null
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageAftercareRequests(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, requestId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { ok: false, error: "Not found" };
  if (!STATUSES.includes(toStatus)) return { ok: false, error: "Invalid status" };
  if (!allowed(row.status, toStatus)) return { ok: false, error: "Transition not allowed" };

  const patch: Parameters<typeof repo.updateServiceRequest>[3] = { status: toStatus };
  const now = new Date().toISOString();

  if (toStatus === "resolved") {
    const rn = resolutionNote?.trim() ?? "";
    if (rn.length < 1) return { ok: false, error: "Resolution note required" };
    patch.resolution_note = rn;
    patch.resolved_at = now;
    patch.resolved_by = ctx.userId;
  }

  if (toStatus === "closed") {
    if (row.status !== "resolved") {
      const n = note?.trim() ?? "";
      if (n.length < 1) return { ok: false, error: "Closure note required when closing before resolution" };
    }
  }

  const ok = await repo.updateServiceRequest(supabase, requestId, ctx.tenantId, patch);
  if (!ok) return { ok: false, error: "Update failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    service_request_id: requestId,
    from_status: row.status,
    to_status: toStatus,
    actor_user_id: ctx.userId,
    note: note ?? null,
  });

  return { ok: true, error: "" };
}
