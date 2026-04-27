import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./defects.repository";
import {
  canManageDefects,
  canReadDefects,
  canReportDefectAsStakeholder,
} from "./defects.policy";
import type {
  DefectEventRow,
  DefectListItem,
  DefectPublicDetail,
  DefectRow,
  DefectStatus,
} from "./defects.types";

const STATUSES: DefectStatus[] = [
  "open",
  "in_progress",
  "ready_for_verification",
  "resolved",
  "closed",
];

const TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["ready_for_verification", "open", "closed"],
  ready_for_verification: ["resolved", "in_progress"],
  resolved: ["closed"],
  closed: [],
};

function allowed(from: DefectStatus, to: DefectStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function toPublicDetail(row: DefectRow): DefectPublicDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    is_blocking: row.is_blocking,
    due_date: row.due_date,
    has_assignee: row.assigned_to != null,
    resolution_note: row.resolution_note,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listDefects(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: DefectListItem[] | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadDefects(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const rows = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data: rows, error: "" };
}

export async function getDefectDetail(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  defectId: string
): Promise<{
  data: (DefectRow & { events: DefectEventRow[] }) | DefectPublicDetail | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadDefects(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, defectId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { data: null, error: "Not found" };
  const events = await repo.listEvents(supabase, defectId, ctx.tenantId);
  const isMgr = await canManageDefects(supabase, ctx, projectId);
  if (isMgr) {
    return { data: { ...row, events }, error: "" };
  }
  return { data: toPublicDetail(row), error: "" };
}

export async function createDefectManager(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: {
    title: string;
    description?: string | null;
    is_blocking?: boolean;
    assigned_to?: string | null;
    due_date?: string | null;
    linked_milestone_id?: string | null;
    linked_document_id?: string | null;
    linked_discussion_id?: string | null;
    linked_request_id?: string | null;
    initial_status?: DefectStatus;
  }
): Promise<{ data: DefectListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageDefects(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };
  const status = input.initial_status ?? "open";
  if (!STATUSES.includes(status)) return { data: null, error: "Invalid status" };
  if (status !== "open" && status !== "in_progress") {
    return { data: null, error: "Create only supports open or in_progress" };
  }

  const row = await repo.insertDefect(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    title,
    description: input.description ?? null,
    status,
    is_blocking: input.is_blocking ?? false,
    assigned_to: input.assigned_to ?? null,
    due_date: input.due_date ?? null,
    linked_milestone_id: input.linked_milestone_id ?? null,
    linked_document_id: input.linked_document_id ?? null,
    linked_discussion_id: input.linked_discussion_id ?? null,
    linked_request_id: input.linked_request_id ?? null,
    created_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    defect_id: row.id,
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
      is_blocking: row.is_blocking,
      due_date: row.due_date,
      updated_at: row.updated_at,
    },
    error: "",
  };
}

export async function createDefectStakeholder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: { title: string; description?: string | null; is_blocking?: boolean }
): Promise<{ data: DefectListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReportDefectAsStakeholder(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };

  const row = await repo.insertDefect(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    title,
    description: input.description ?? null,
    status: "open",
    is_blocking: input.is_blocking ?? false,
    assigned_to: null,
    due_date: null,
    linked_milestone_id: null,
    linked_document_id: null,
    linked_discussion_id: null,
    linked_request_id: null,
    created_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };
  return {
    data: {
      id: row.id,
      title: row.title,
      status: row.status,
      is_blocking: row.is_blocking,
      due_date: row.due_date,
      updated_at: row.updated_at,
    },
    error: "",
  };
}

export async function patchDefectManager(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  defectId: string,
  input: Partial<{
    title: string;
    description: string | null;
    is_blocking: boolean;
    assigned_to: string | null;
    due_date: string | null;
    linked_milestone_id: string | null;
    linked_document_id: string | null;
    linked_discussion_id: string | null;
    linked_request_id: string | null;
  }>
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageDefects(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, defectId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { ok: false, error: "Not found" };
  if (row.status === "closed") return { ok: false, error: "Defect is closed" };

  const patch: Parameters<typeof repo.updateDefect>[3] = {};
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 1) return { ok: false, error: "Title required" };
    patch.title = t;
  }
  if (input.description !== undefined) patch.description = input.description;
  if (input.is_blocking !== undefined) patch.is_blocking = input.is_blocking;
  if (input.assigned_to !== undefined) patch.assigned_to = input.assigned_to;
  if (input.due_date !== undefined) patch.due_date = input.due_date;
  if (input.linked_milestone_id !== undefined) patch.linked_milestone_id = input.linked_milestone_id;
  if (input.linked_document_id !== undefined) patch.linked_document_id = input.linked_document_id;
  if (input.linked_discussion_id !== undefined) patch.linked_discussion_id = input.linked_discussion_id;
  if (input.linked_request_id !== undefined) patch.linked_request_id = input.linked_request_id;

  const ok = await repo.updateDefect(supabase, defectId, ctx.tenantId, patch);
  return ok ? { ok: true, error: "" } : { ok: false, error: "Update failed" };
}

export async function transitionDefect(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  defectId: string,
  toStatus: DefectStatus,
  note?: string | null,
  resolutionNote?: string | null
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageDefects(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const row = await repo.getById(supabase, defectId, ctx.tenantId);
  if (!row || row.project_id !== projectId) return { ok: false, error: "Not found" };
  if (!STATUSES.includes(toStatus)) return { ok: false, error: "Invalid status" };
  if (!allowed(row.status, toStatus)) return { ok: false, error: "Transition not allowed" };

  const patch: Parameters<typeof repo.updateDefect>[3] = { status: toStatus };
  const now = new Date().toISOString();
  if (toStatus === "resolved") {
    const rn = resolutionNote?.trim() ?? "";
    if (rn.length < 1) return { ok: false, error: "Resolution note required" };
    patch.resolution_note = rn;
    patch.resolved_at = now;
    patch.resolved_by = ctx.userId;
  }
  if (toStatus === "closed" && row.status === "resolved") {
    /* keep resolution fields */
  }

  const ok = await repo.updateDefect(supabase, defectId, ctx.tenantId, patch);
  if (!ok) return { ok: false, error: "Update failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    defect_id: defectId,
    from_status: row.status,
    to_status: toStatus,
    actor_user_id: ctx.userId,
    note: note ?? null,
  });

  return { ok: true, error: "" };
}
