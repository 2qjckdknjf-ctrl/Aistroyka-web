import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * AIS-CLIENT-005A — safe intake draft projection for contractor extraction UI.
 * Never includes budget_range or other commercial fields.
 */
export type IntakeDraftExtractionSummary = {
  id: string;
  title: string;
  description: string;
  status: string;
  project_id: string | null;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

function parseSummary(row: Record<string, unknown>): IntakeDraftExtractionSummary | null {
  const id = asString(row.id);
  const title = asString(row.title);
  const description = asString(row.description);
  const status = asString(row.status);
  const updatedAt = asString(row.updated_at);
  if (!id || !title || !description || !status || !updatedAt) return null;
  return {
    id,
    title,
    description,
    status,
    project_id: asString(row.project_id),
    updated_at: updatedAt,
  };
}

/**
 * Validate intake draft for linking to a project extraction run.
 * Draft must belong to tenant; project_id must be null or match the route project;
 * withdrawn drafts are rejected.
 */
export async function resolveIntakeDraftForExtraction(
  supabase: SupabaseClient,
  input: { tenantId: string; projectId: string; intakeDraftId: string }
): Promise<
  | { ok: true; draft: IntakeDraftExtractionSummary }
  | { ok: false; error: string; code: "DRAFT_NOT_FOUND" | "DRAFT_PROJECT_MISMATCH" | "DRAFT_WITHDRAWN" | "LOOKUP_FAILED" }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const intakeDraftId = input.intakeDraftId.trim();
  if (!tenantId || !projectId || !intakeDraftId || !isLikelyUuid(intakeDraftId)) {
    return { ok: false, error: "Intake draft not found", code: "DRAFT_NOT_FOUND" };
  }

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .select("id, title, description, status, project_id, updated_at")
    .eq("id", intakeDraftId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  if (!data || !isRecord(data)) {
    return { ok: false, error: "Intake draft not found", code: "DRAFT_NOT_FOUND" };
  }
  const draft = parseSummary(data);
  if (!draft) {
    return { ok: false, error: "Intake draft not found", code: "DRAFT_NOT_FOUND" };
  }
  if (draft.status === "withdrawn") {
    return { ok: false, error: "Intake draft withdrawn", code: "DRAFT_WITHDRAWN" };
  }
  if (draft.project_id !== null && draft.project_id !== projectId) {
    return {
      ok: false,
      error: "Intake draft belongs to another project",
      code: "DRAFT_PROJECT_MISMATCH",
    };
  }
  return { ok: true, draft };
}

/**
 * List project-bound (or unassigned) intake drafts for manager extraction picker.
 * Omits budget_range and other commercial fields by select list.
 */
export async function listProjectIntakeDraftsForExtraction(
  supabase: SupabaseClient,
  input: { tenantId: string; projectId: string; limit?: number }
): Promise<
  | { ok: true; drafts: IntakeDraftExtractionSummary[] }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  if (!tenantId || !projectId || !isLikelyUuid(projectId)) {
    return { ok: false, error: "tenantId and projectId required", code: "INVALID_INPUT" };
  }
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .select("id, title, description, status, project_id, updated_at")
    .eq("tenant_id", tenantId)
    .or(`project_id.eq.${projectId},project_id.is.null`)
    .neq("status", "withdrawn")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const drafts: IntakeDraftExtractionSummary[] = [];
  for (const row of data ?? []) {
    if (!isRecord(row)) continue;
    const parsed = parseSummary(row);
    if (parsed) drafts.push(parsed);
  }
  return { ok: true, drafts };
}
