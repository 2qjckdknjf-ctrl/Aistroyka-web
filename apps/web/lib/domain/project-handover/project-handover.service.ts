import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { computeHandoverReadiness } from "./handover-readiness";
import * as repo from "./project-handover.repository";
import { canManageProjectHandover, canReadProjectHandover } from "./project-handover.policy";
import type {
  HandoverReadinessResult,
  ProjectHandoverEventRow,
  ProjectHandoverPublicSummary,
  ProjectHandoverRow,
  ProjectHandoverStatus,
} from "./project-handover.types";

const ORDER: ProjectHandoverStatus[] = ["in_progress", "handover_ready", "handed_over", "completed"];

function nextAllowed(from: ProjectHandoverStatus): ProjectHandoverStatus | null {
  const i = ORDER.indexOf(from);
  if (i < 0 || i >= ORDER.length - 1) return null;
  return ORDER[i + 1] ?? null;
}

async function ensureHandoverRow(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<ProjectHandoverRow | null> {
  let row = await repo.getByProject(supabase, projectId, tenantId);
  if (!row) {
    row = await repo.insertHandover(supabase, { tenant_id: tenantId, project_id: projectId });
  }
  return row;
}

export async function getHandoverForManager(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{
  data: {
    handover: ProjectHandoverRow;
    readiness: HandoverReadinessResult;
    events: ProjectHandoverEventRow[];
  } | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageProjectHandover(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const handover = await ensureHandoverRow(supabase, ctx.tenantId, projectId);
  if (!handover) return { data: null, error: "Could not load handover" };
  const [readiness, events] = await Promise.all([
    computeHandoverReadiness(supabase, projectId, ctx.tenantId),
    repo.listEvents(supabase, handover.id, ctx.tenantId),
  ]);
  return { data: { handover, readiness, events }, error: "" };
}

export async function getHandoverPublicSummary(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ProjectHandoverPublicSummary | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadProjectHandover(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const row = await ensureHandoverRow(supabase, ctx.tenantId, projectId);
  if (!row) return { data: null, error: "Could not load handover" };
  const showNotes = row.status === "handed_over" || row.status === "completed";
  return {
    data: {
      status: row.status,
      handover_notes: showNotes ? row.handover_notes : null,
      handed_over_at: row.handed_over_at,
      completed_at: row.completed_at,
    },
    error: "",
  };
}

export async function transitionHandover(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  toStatus: ProjectHandoverStatus,
  note?: string | null
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!(await canManageProjectHandover(supabase, ctx, projectId))) {
    return { ok: false, error: "Insufficient rights" };
  }
  const handover = await ensureHandoverRow(supabase, ctx.tenantId, projectId);
  if (!handover) return { ok: false, error: "Could not load handover" };
  const expected = nextAllowed(handover.status);
  if (!expected || expected !== toStatus) {
    return { ok: false, error: "Invalid transition" };
  }

  const readiness = await computeHandoverReadiness(supabase, projectId, ctx.tenantId);
  if (!readiness.ready && (toStatus === "handover_ready" || toStatus === "handed_over")) {
    return { ok: false, error: "Handover is blocked — resolve blockers first" };
  }

  const now = new Date().toISOString();
  const patch: Parameters<typeof repo.updateHandover>[3] = { status: toStatus };
  if (toStatus === "handed_over") {
    patch.handed_over_at = now;
    patch.handed_over_by = ctx.userId;
    patch.handover_notes = note?.trim() || handover.handover_notes;
  }
  if (toStatus === "completed") {
    patch.completed_at = now;
    patch.completed_by = ctx.userId;
  }

  const ok = await repo.updateHandover(supabase, handover.id, ctx.tenantId, patch);
  if (!ok) return { ok: false, error: "Update failed" };

  await repo.insertEvent(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    handover_id: handover.id,
    from_status: handover.status,
    to_status: toStatus,
    actor_user_id: ctx.userId,
    note: note ?? null,
  });

  return { ok: true, error: "" };
}
