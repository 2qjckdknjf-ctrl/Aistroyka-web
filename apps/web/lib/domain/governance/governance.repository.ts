import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GovernanceCaseRow,
  GovernanceCaseWithProjects,
  GovernanceCaseListFilters,
} from "./governance.types";

const ACTIVE_STATUSES = ["open", "under_review", "decision_required", "decided"] as const;

export async function countOpenGovernanceCases(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ open: number; criticalOpen: number }> {
  const { data: openRows, error: e1 } = await supabase
    .from("governance_cases")
    .select("id, severity")
    .eq("tenant_id", tenantId)
    .in("status", [...ACTIVE_STATUSES]);
  if (e1 || !openRows) return { open: 0, criticalOpen: 0 };
  const rows = openRows as { id: string; severity: string }[];
  return {
    open: rows.length,
    criticalOpen: rows.filter((r) => r.severity === "critical").length,
  };
}

/** Open = not resolved or archived */
export async function countActiveGovernanceCases(supabase: SupabaseClient, tenantId: string): Promise<number> {
  const { count, error } = await supabase
    .from("governance_cases")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", [...ACTIVE_STATUSES]);
  if (error) return 0;
  return count ?? 0;
}

export async function listGovernanceCases(
  supabase: SupabaseClient,
  tenantId: string,
  filters: GovernanceCaseListFilters = {}
): Promise<GovernanceCaseWithProjects[]> {
  const limit = Math.min(filters.limit ?? 50, 100);
  let q = supabase
    .from("governance_cases")
    .select(
      "id, tenant_id, title, rationale, status, severity, decision_required, decision_outcome, created_by, owned_by, decided_by, decided_at, resolved_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.status) {
    if (Array.isArray(filters.status)) q = q.in("status", filters.status);
    else q = q.eq("status", filters.status);
  }
  if (filters.severity) q = q.eq("severity", filters.severity);

  const { data: cases, error } = await q;
  if (error || !cases?.length) return [];

  const ids = (cases as GovernanceCaseRow[]).map((c) => c.id);
  const { data: links } = await supabase
    .from("governance_case_projects")
    .select("governance_case_id, project_id, note")
    .eq("tenant_id", tenantId)
    .in("governance_case_id", ids);

  const projectIds = [...new Set((links ?? []).map((l: { project_id: string }) => l.project_id))];
  let names = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: prows } = await supabase
      .from("projects")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .in("id", projectIds);
    names = new Map((prows ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
  }

  const byCase = new Map<string, Array<{ project_id: string; project_name: string; note: string | null }>>();
  for (const l of links ?? []) {
    const row = l as { governance_case_id: string; project_id: string; note: string | null };
    const list = byCase.get(row.governance_case_id) ?? [];
    list.push({
      project_id: row.project_id,
      project_name: names.get(row.project_id) ?? "Project",
      note: row.note,
    });
    byCase.set(row.governance_case_id, list);
  }

  return (cases as GovernanceCaseRow[]).map((c) => ({
    ...c,
    projects: byCase.get(c.id) ?? [],
  }));
}

export async function getGovernanceCaseById(
  supabase: SupabaseClient,
  tenantId: string,
  caseId: string
): Promise<GovernanceCaseWithProjects | null> {
  const { data: row, error } = await supabase
    .from("governance_cases")
    .select(
      "id, tenant_id, title, rationale, status, severity, decision_required, decision_outcome, created_by, owned_by, decided_by, decided_at, resolved_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", caseId)
    .maybeSingle();
  if (error || !row) return null;

  const { data: links } = await supabase
    .from("governance_case_projects")
    .select("project_id, note")
    .eq("tenant_id", tenantId)
    .eq("governance_case_id", caseId);

  const projectIds = (links ?? []).map((l: { project_id: string }) => l.project_id);
  let names = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: prows } = await supabase
      .from("projects")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .in("id", projectIds);
    names = new Map((prows ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
  }

  const projects = (links ?? []).map((l: { project_id: string; note: string | null }) => ({
    project_id: l.project_id,
    project_name: names.get(l.project_id) ?? "Project",
    note: l.note,
  }));

  return { ...(row as GovernanceCaseRow), projects };
}

export async function insertGovernanceCaseEvent(
  supabase: SupabaseClient,
  tenantId: string,
  caseId: string,
  event: {
    event_kind: string;
    from_status?: string | null;
    to_status?: string | null;
    decision_outcome?: string | null;
    actor_user_id: string;
    note?: string | null;
  }
): Promise<boolean> {
  const { error } = await supabase.from("governance_case_events").insert({
    tenant_id: tenantId,
    governance_case_id: caseId,
    event_kind: event.event_kind,
    from_status: event.from_status ?? null,
    to_status: event.to_status ?? null,
    decision_outcome: event.decision_outcome ?? null,
    actor_user_id: event.actor_user_id,
    note: event.note ?? null,
  });
  return !error;
}

export function isActiveStatus(status: string): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

export { ACTIVE_STATUSES };
