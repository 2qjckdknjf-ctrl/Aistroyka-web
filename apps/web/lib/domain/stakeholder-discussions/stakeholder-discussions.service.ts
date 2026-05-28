import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./stakeholder-discussions.repository";
import {
  canManageStakeholderDiscussions,
  canParticipateStakeholderDiscussion,
  canReadStakeholderDiscussions,
} from "./stakeholder-discussions.policy";
import type {
  StakeholderDiscussionDetailManager,
  StakeholderDiscussionEntryPublic,
  StakeholderDiscussionKind,
  StakeholderDiscussionLinkedType,
  StakeholderDiscussionListItem,
  StakeholderDiscussionEntryKind,
  StakeholderDiscussionPublicDetail,
  StakeholderDiscussionStatus,
} from "./stakeholder-discussions.types";

const KINDS: StakeholderDiscussionKind[] = [
  "document_clarification",
  "milestone_decision",
  "request_followup",
  "general",
];

const ENTRY_KINDS: StakeholderDiscussionEntryKind[] = [
  "question",
  "clarification",
  "option_selected",
  "feedback",
  "resolution_note",
];

function toPublicEntries(rows: Awaited<ReturnType<typeof repo.listEntries>>): StakeholderDiscussionEntryPublic[] {
  return rows.map((e) => ({
    id: e.id,
    entry_kind: e.entry_kind,
    body: e.body,
    created_at: e.created_at,
  }));
}

export async function listDiscussions(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: StakeholderDiscussionListItem[] | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadStakeholderDiscussions(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const rows = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data: rows, error: "" };
}

export async function getDiscussionDetail(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  discussionId: string
): Promise<{
  data: StakeholderDiscussionDetailManager | StakeholderDiscussionPublicDetail | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadStakeholderDiscussions(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const d = await repo.getById(supabase, discussionId, ctx.tenantId);
  if (!d || d.project_id !== projectId) return { data: null, error: "Not found" };
  const entries = await repo.listEntries(supabase, discussionId, ctx.tenantId);
  const isMgr = await canManageStakeholderDiscussions(supabase, ctx, projectId);
  if (isMgr) {
    return {
      data: {
        id: d.id,
        kind: d.kind,
        status: d.status,
        title: d.title,
        context: d.context,
        linked_entity_type: d.linked_entity_type,
        linked_entity_id: d.linked_entity_id,
        created_at: d.created_at,
        updated_at: d.updated_at,
        created_by: d.created_by,
        resolved_at: d.resolved_at,
        resolution_summary: d.resolution_summary,
        resolved_by: d.resolved_by,
        entries,
      },
      error: "",
    };
  }
  const pub: StakeholderDiscussionPublicDetail = {
    id: d.id,
    kind: d.kind,
    status: d.status,
    title: d.title,
    context: d.context,
    linked_entity_type: d.linked_entity_type,
    linked_entity_id: d.linked_entity_id,
    created_at: d.created_at,
    updated_at: d.updated_at,
    resolved_at: d.resolved_at,
    resolution_summary: d.resolution_summary,
    entries: toPublicEntries(entries),
  };
  return { data: pub, error: "" };
}

export async function createDiscussion(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: {
    kind: StakeholderDiscussionKind;
    title: string;
    context?: string | null;
    linked_entity_type?: StakeholderDiscussionLinkedType | null;
    linked_entity_id?: string | null;
    initial_status?: StakeholderDiscussionStatus;
  }
): Promise<{ data: StakeholderDiscussionListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageStakeholderDiscussions(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  if (!input.kind || !KINDS.includes(input.kind)) return { data: null, error: "Invalid kind" };
  const title = input.title?.trim() ?? "";
  if (title.length < 1) return { data: null, error: "Title required" };
  const status = input.initial_status ?? "awaiting_stakeholder";
  const allowed: StakeholderDiscussionStatus[] = ["open", "awaiting_stakeholder", "awaiting_manager"];
  if (!allowed.includes(status)) return { data: null, error: "Invalid initial status" };

  const row = await repo.insertDiscussion(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    kind: input.kind,
    status,
    title,
    context: input.context ?? null,
    linked_entity_type: input.linked_entity_type ?? null,
    linked_entity_id: input.linked_entity_id ?? null,
    created_by: ctx.userId,
  });
  if (!row) return { data: null, error: "Create failed" };
  return {
    data: {
      id: row.id,
      kind: row.kind,
      status: row.status,
      title: row.title,
      context: row.context,
      linked_entity_type: row.linked_entity_type,
      linked_entity_id: row.linked_entity_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    error: "",
  };
}

export async function addDiscussionEntry(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient | undefined,
  ctx: TenantContext,
  projectId: string,
  discussionId: string,
  input: { entry_kind: StakeholderDiscussionEntryKind; body: string }
): Promise<{ data: { id: string } | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  const d = await repo.getById(supabase, discussionId, ctx.tenantId);
  if (!d || d.project_id !== projectId) return { data: null, error: "Not found" };
  if (d.status === "resolved" || d.status === "closed") {
    return { data: null, error: "Discussion is not open for updates" };
  }

  const body = input.body?.trim() ?? "";
  if (body.length < 1) return { data: null, error: "Body required" };
  if (!input.entry_kind || !ENTRY_KINDS.includes(input.entry_kind)) {
    return { data: null, error: "Invalid entry_kind" };
  }

  const isManager = await canManageStakeholderDiscussions(supabase, ctx, projectId);
  const isParticipant = await canParticipateStakeholderDiscussion(supabase, ctx, projectId);

  if (!isManager && input.entry_kind === "resolution_note") {
    return { data: null, error: "Invalid entry kind for participant" };
  }

  if (!isManager && !isParticipant) return { data: null, error: "Insufficient rights" };
  if (!isManager && isParticipant) {
    if (d.status !== "awaiting_stakeholder" && d.status !== "open") {
      return { data: null, error: "Not awaiting your response" };
    }
  }

  const nextStatus: StakeholderDiscussionStatus | null = isManager
    ? d.status === "awaiting_manager" || d.status === "open"
      ? "awaiting_stakeholder"
      : null
    : isParticipant
      ? "awaiting_manager"
      : null;

  if (isParticipant && nextStatus && !adminSupabase) {
    return { data: null, error: "Discussion updates require server configuration" };
  }

  const entry = await repo.insertEntry(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    discussion_id: discussionId,
    author_user_id: ctx.userId,
    entry_kind: input.entry_kind,
    body,
  });
  if (!entry) return { data: null, error: "Failed to add entry" };

  if (nextStatus) {
    if (isManager) {
      await repo.updateDiscussion(supabase, discussionId, ctx.tenantId, { status: nextStatus });
    } else if (isParticipant) {
      // Participant status flips run through server-side admin client after explicit policy checks above.
      await repo.updateDiscussion(adminSupabase, discussionId, ctx.tenantId, { status: nextStatus });
    }
  }

  return { data: { id: entry.id }, error: "" };
}

export async function resolveDiscussion(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  discussionId: string,
  resolution_summary: string
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageStakeholderDiscussions(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const d = await repo.getById(supabase, discussionId, ctx.tenantId);
  if (!d || d.project_id !== projectId) return { ok: false, error: "Not found" };
  if (d.status === "closed") return { ok: false, error: "Already closed" };
  const summary = resolution_summary?.trim() ?? "";
  if (summary.length < 1) return { ok: false, error: "Resolution summary required" };
  const now = new Date().toISOString();
  const ok = await repo.updateDiscussion(supabase, discussionId, ctx.tenantId, {
    status: "resolved",
    resolution_summary: summary,
    resolved_at: now,
    resolved_by: ctx.userId,
  });
  if (!ok) return { ok: false, error: "Update failed" };

  await repo.insertEntry(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    discussion_id: discussionId,
    author_user_id: ctx.userId,
    entry_kind: "resolution_note",
    body: summary,
  });

  return { ok: true, error: "" };
}

export async function closeDiscussion(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  discussionId: string
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageStakeholderDiscussions(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const d = await repo.getById(supabase, discussionId, ctx.tenantId);
  if (!d || d.project_id !== projectId) return { ok: false, error: "Not found" };
  const ok = await repo.updateDiscussion(supabase, discussionId, ctx.tenantId, { status: "closed" });
  return ok ? { ok: true, error: "" } : { ok: false, error: "Update failed" };
}
