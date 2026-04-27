import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { isPortalOnlyStakeholderRole } from "@/lib/tenant/tenant.policy";
import type {
  GovernanceCaseStatus,
  CreateGovernanceCaseInput,
  UpdateGovernanceCaseInput,
  GovernanceCaseWithProjects,
} from "./governance.types";
import {
  getGovernanceCaseById,
  insertGovernanceCaseEvent,
  listGovernanceCases,
} from "./governance.repository";
import type { GovernanceCaseListFilters } from "./governance.types";

const TRANSITIONS: Record<GovernanceCaseStatus, GovernanceCaseStatus[]> = {
  open: ["under_review", "decision_required", "archived"],
  under_review: ["decision_required", "decided", "resolved", "archived"],
  decision_required: ["decided", "under_review", "archived"],
  decided: ["resolved", "archived"],
  resolved: ["archived"],
  archived: [],
};

export function canTransition(from: GovernanceCaseStatus, to: GovernanceCaseStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function requireInternalWorkspace(ctx: TenantContext): string | null {
  if (!ctx.tenantId || !ctx.userId) return "Tenant required";
  if (isPortalOnlyStakeholderRole(ctx)) return "Insufficient rights";
  return null;
}

async function verifyProjectsInTenant(
  supabase: SupabaseClient,
  tenantId: string,
  projectIds: string[]
): Promise<boolean> {
  const uniq = [...new Set(projectIds)].filter(Boolean);
  if (uniq.length === 0) return false;
  const { data, error } = await supabase.from("projects").select("id").eq("tenant_id", tenantId).in("id", uniq);
  if (error || !data) return false;
  return data.length === uniq.length;
}

export async function createGovernanceCase(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateGovernanceCaseInput
): Promise<{ data: GovernanceCaseWithProjects | null; error: string | null }> {
  const gate = requireInternalWorkspace(ctx);
  if (gate) return { data: null, error: gate };
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  const projectIds = [...new Set(input.project_ids)].filter(Boolean);
  if (projectIds.length === 0) return { data: null, error: "At least one affected project is required" };

  const ok = await verifyProjectsInTenant(supabase, ctx.tenantId, projectIds);
  if (!ok) return { data: null, error: "One or more projects are invalid for this tenant" };

  const { data: inserted, error: insErr } = await supabase
    .from("governance_cases")
    .insert({
      tenant_id: ctx.tenantId,
      title: input.title.trim(),
      rationale: input.rationale?.trim() ?? null,
      severity: input.severity,
      decision_required: input.decision_required.trim(),
      created_by: ctx.userId,
      owned_by: input.owned_by ?? null,
      status: "open",
    })
    .select(
      "id, tenant_id, title, rationale, status, severity, decision_required, decision_outcome, created_by, owned_by, decided_by, decided_at, resolved_at, created_at, updated_at"
    )
    .single();

  if (insErr || !inserted) {
    return { data: null, error: insErr?.message ?? "Failed to create case" };
  }

  const caseId = (inserted as { id: string }).id;
  const linkRows = projectIds.map((pid) => ({
    governance_case_id: caseId,
    tenant_id: ctx.tenantId!,
    project_id: pid,
    note: input.project_notes?.[pid]?.trim() ?? null,
  }));

  const { error: linkErr } = await supabase.from("governance_case_projects").insert(linkRows);
  if (linkErr) {
    await supabase.from("governance_cases").delete().eq("id", caseId).eq("tenant_id", ctx.tenantId);
    return { data: null, error: linkErr.message };
  }

  await insertGovernanceCaseEvent(supabase, ctx.tenantId, caseId, {
    event_kind: "created",
    to_status: "open",
    actor_user_id: ctx.userId,
    note: null,
  });

  const full = await getGovernanceCaseById(supabase, ctx.tenantId, caseId);
  return { data: full, error: null };
}

export async function updateGovernanceCase(
  supabase: SupabaseClient,
  ctx: TenantContext,
  caseId: string,
  input: UpdateGovernanceCaseInput
): Promise<{ data: GovernanceCaseWithProjects | null; error: string | null }> {
  const gate = requireInternalWorkspace(ctx);
  if (gate) return { data: null, error: gate };
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  const existing = await getGovernanceCaseById(supabase, ctx.tenantId, caseId);
  if (!existing) return { data: null, error: "Not found" };

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.rationale !== undefined) patch.rationale = input.rationale?.trim() ?? null;
  if (input.severity !== undefined) patch.severity = input.severity;
  if (input.decision_required !== undefined) patch.decision_required = input.decision_required.trim();
  if (input.owned_by !== undefined) patch.owned_by = input.owned_by;
  if (input.decision_outcome !== undefined) patch.decision_outcome = input.decision_outcome?.trim() ?? null;
  if (input.decided_by !== undefined) patch.decided_by = input.decided_by;
  if (input.decided_at !== undefined) patch.decided_at = input.decided_at;
  if (input.resolved_at !== undefined) patch.resolved_at = input.resolved_at;

  const outcomeAfter =
    input.decision_outcome !== undefined ? input.decision_outcome?.trim() ?? null : existing.decision_outcome;

  if (input.status !== undefined) {
    if (!canTransition(existing.status, input.status)) {
      return { data: null, error: `Invalid status transition: ${existing.status} → ${input.status}` };
    }
    if (input.status === "decided" && !outcomeAfter) {
      return { data: null, error: "decision_outcome is required when moving to decided" };
    }
    if (input.status === "resolved" && !outcomeAfter) {
      return { data: null, error: "decision_outcome is required before resolving" };
    }
    patch.status = input.status;
    if (input.status === "decided") {
      patch.decided_by = (input.decided_by ?? ctx.userId) as string;
      patch.decided_at = (input.decided_at ?? new Date().toISOString()) as string;
    }
    if (input.status === "resolved") {
      patch.resolved_at = (input.resolved_at ?? new Date().toISOString()) as string;
    }
  }

  if (input.status !== undefined && input.status !== existing.status) {
    await insertGovernanceCaseEvent(supabase, ctx.tenantId, caseId, {
      event_kind: "status_change",
      from_status: existing.status,
      to_status: input.status,
      actor_user_id: ctx.userId,
      note: null,
    });
  }

  if (
    input.decision_outcome !== undefined &&
    (input.decision_outcome?.trim() ?? null) !== (existing.decision_outcome ?? null)
  ) {
    await insertGovernanceCaseEvent(supabase, ctx.tenantId, caseId, {
      event_kind: "decision_recorded",
      actor_user_id: ctx.userId,
      decision_outcome: input.decision_outcome?.trim() ?? null,
      note: null,
    });
  }

  if (Object.keys(patch).length > 0) {
    const { error: upErr } = await supabase
      .from("governance_cases")
      .update(patch)
      .eq("id", caseId)
      .eq("tenant_id", ctx.tenantId);
    if (upErr) return { data: null, error: upErr.message };
  }

  if (input.project_ids !== undefined) {
    const projectIds = [...new Set(input.project_ids)].filter(Boolean);
    if (projectIds.length === 0) return { data: null, error: "At least one affected project is required" };
    const ok = await verifyProjectsInTenant(supabase, ctx.tenantId, projectIds);
    if (!ok) return { data: null, error: "One or more projects are invalid for this tenant" };
    await supabase.from("governance_case_projects").delete().eq("governance_case_id", caseId).eq("tenant_id", ctx.tenantId);
    const linkRows = projectIds.map((pid) => ({
      governance_case_id: caseId,
      tenant_id: ctx.tenantId!,
      project_id: pid,
      note: input.project_notes?.[pid]?.trim() ?? null,
    }));
    const { error: linkErr } = await supabase.from("governance_case_projects").insert(linkRows);
    if (linkErr) return { data: null, error: linkErr.message };
    await insertGovernanceCaseEvent(supabase, ctx.tenantId, caseId, {
      event_kind: "updated",
      actor_user_id: ctx.userId,
      note: "Affected projects updated",
    });
  }

  const full = await getGovernanceCaseById(supabase, ctx.tenantId, caseId);
  return { data: full, error: null };
}

export async function listGovernanceCasesForTenant(
  supabase: SupabaseClient,
  ctx: TenantContext,
  filters: GovernanceCaseListFilters = {}
): Promise<{ data: GovernanceCaseWithProjects[]; error: string | null }> {
  const gate = requireInternalWorkspace(ctx);
  if (gate) return { data: [], error: gate };
  if (!ctx.tenantId) return { data: [], error: "Tenant required" };
  const rows = await listGovernanceCases(supabase, ctx.tenantId, filters);
  return { data: rows, error: null };
}

export async function getGovernanceCase(
  supabase: SupabaseClient,
  ctx: TenantContext,
  caseId: string
): Promise<{ data: GovernanceCaseWithProjects | null; error: string | null }> {
  const gate = requireInternalWorkspace(ctx);
  if (gate) return { data: null, error: gate };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  const row = await getGovernanceCaseById(supabase, ctx.tenantId, caseId);
  return { data: row, error: row ? null : "Not found" };
}
