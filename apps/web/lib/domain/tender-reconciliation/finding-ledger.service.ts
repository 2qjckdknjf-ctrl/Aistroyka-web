import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReconciliationFindingDto,
  ReconciliationFindingKind,
  ReconciliationFindingStatus,
} from "./finding-ledger.types";

const KINDS = new Set<ReconciliationFindingKind>([
  "quantity_mismatch",
  "scope_mismatch",
  "missing_scale_or_unit",
  "contradictory_revision",
  "duplicate_evidence",
  "unavailable_source",
]);

const STATUSES = new Set<ReconciliationFindingStatus>([
  "open",
  "needs_review",
  "accepted",
  "rejected",
  "superseded",
]);

const FORBIDDEN_DETAIL_KEYS = new Set([
  "unit_price",
  "unit_cost",
  "total_price",
  "margin",
  "profitability",
  "cost",
  "costs",
  "markup",
  "subcontractor_cost",
  "internal_budget",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseReconciliationFindingKind(value: unknown): ReconciliationFindingKind | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim() as ReconciliationFindingKind;
  return KINDS.has(normalized) ? normalized : null;
}

export function parseReconciliationFindingStatus(
  value: unknown
): Exclude<ReconciliationFindingStatus, "open" | "needs_review" | "superseded"> | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "accepted" || normalized === "rejected") return normalized;
  return null;
}

/** Fail closed if caller tries to smuggle contractor finance into details_json. */
export function assertFindingDetailsSafe(details: unknown): string | null {
  return scan(details, "");
}

function scan(value: unknown, path: string): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = scan(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_DETAIL_KEYS.has(key.toLowerCase())) {
        return `commercial field forbidden in finding details: ${path ? `${path}.` : ""}${key}`;
      }
      const hit = scan(child, path ? `${path}.${key}` : key);
      if (hit) return hit;
    }
  }
  return null;
}

function parseFinding(row: Record<string, unknown>): ReconciliationFindingDto | null {
  const id = asString(row.id);
  const projectId = asString(row.project_id);
  const kind = asString(row.kind) as ReconciliationFindingKind | null;
  const status = asString(row.status) as ReconciliationFindingStatus | null;
  const title = asString(row.title);
  const summary = asString(row.summary);
  const uncertainty = asString(row.uncertainty) ?? "unknown";
  const createdAt = asString(row.created_at);
  if (!id || !projectId || !kind || !status || !title || !summary || !createdAt) return null;
  if (!KINDS.has(kind) || !STATUSES.has(status)) return null;
  return {
    id,
    project_id: projectId,
    kind,
    status,
    title,
    summary,
    expected_quantity: asFiniteNumber(row.expected_quantity),
    observed_quantity: asFiniteNumber(row.observed_quantity),
    unit: asString(row.unit),
    source_document_ref: asString(row.source_document_ref),
    source_revision: asString(row.source_revision),
    estimate_ref: asString(row.estimate_ref),
    measurement_method: asString(row.measurement_method),
    uncertainty,
    review_note: asString(row.review_note),
    reviewed_by: asString(row.reviewed_by),
    reviewed_at: asString(row.reviewed_at),
    created_at: createdAt,
  };
}

export type CreateReconciliationFindingInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  kind: ReconciliationFindingKind;
  title: string;
  summary: string;
  expectedQuantity?: number | null;
  observedQuantity?: number | null;
  unit?: string | null;
  sourceDocumentRef?: string | null;
  sourceRevision?: string | null;
  estimateRef?: string | null;
  measurementMethod?: string | null;
  uncertainty?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Create a NEEDS_REVIEW finding. Does not mutate estimates or Graph.
 * Quantity mismatch without both quantities → missing_scale_or_unit semantics via caller kind.
 */
export async function createReconciliationFinding(
  supabase: SupabaseClient,
  input: CreateReconciliationFindingInput
): Promise<
  | { ok: true; finding: ReconciliationFindingDto }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const actorUserId = input.actorUserId.trim();
  const title = input.title.trim().slice(0, 200);
  const summary = input.summary.trim().slice(0, 2000);
  if (!tenantId || !projectId || !actorUserId || !title || !summary) {
    return { ok: false, error: "required fields missing", code: "INVALID_INPUT" };
  }
  if (!KINDS.has(input.kind)) {
    return { ok: false, error: "invalid kind", code: "INVALID_INPUT" };
  }

  const details = input.details ?? {};
  const bad = assertFindingDetailsSafe(details);
  if (bad) return { ok: false, error: bad, code: "COMMERCIAL_FORBIDDEN" };

  if (
    input.kind === "quantity_mismatch" &&
    (input.expectedQuantity === null ||
      input.expectedQuantity === undefined ||
      input.observedQuantity === null ||
      input.observedQuantity === undefined ||
      !input.unit?.trim())
  ) {
    return {
      ok: false,
      error: "quantity_mismatch requires expected_quantity, observed_quantity, and unit",
      code: "INVALID_INPUT",
    };
  }

  const { data, error } = await supabase
    .from("tender_reconciliation_findings")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      kind: input.kind,
      status: "needs_review",
      title,
      summary,
      expected_quantity:
        typeof input.expectedQuantity === "number" && Number.isFinite(input.expectedQuantity)
          ? input.expectedQuantity
          : null,
      observed_quantity:
        typeof input.observedQuantity === "number" && Number.isFinite(input.observedQuantity)
          ? input.observedQuantity
          : null,
      unit: input.unit?.trim() ? input.unit.trim().slice(0, 32) : null,
      source_document_ref: input.sourceDocumentRef?.trim() || null,
      source_revision: input.sourceRevision?.trim() || null,
      estimate_ref: input.estimateRef?.trim() || null,
      measurement_method: input.measurementMethod?.trim() || null,
      uncertainty: input.uncertainty?.trim() || "unknown",
      details_json: details,
      created_by: actorUserId,
    })
    .select(
      "id, project_id, kind, status, title, summary, expected_quantity, observed_quantity, unit, source_document_ref, source_revision, estimate_ref, measurement_method, uncertainty, review_note, reviewed_by, reviewed_at, created_at"
    )
    .maybeSingle();

  if (error || !data || !isRecord(data)) {
    return { ok: false, error: error?.message ?? "insert failed", code: "INSERT_FAILED" };
  }
  const finding = parseFinding(data);
  if (!finding) return { ok: false, error: "malformed finding", code: "INSERT_FAILED" };
  return { ok: true, finding };
}

export async function listReconciliationFindings(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  limit = 50
): Promise<
  | { ok: true; findings: ReconciliationFindingDto[] }
  | { ok: false; error: string; code: string }
> {
  const capped = Math.min(Math.max(limit, 1), 100);
  const { data, error } = await supabase
    .from("tender_reconciliation_findings")
    .select(
      "id, project_id, kind, status, title, summary, expected_quantity, observed_quantity, unit, source_document_ref, source_revision, estimate_ref, measurement_method, uncertainty, review_note, reviewed_by, reviewed_at, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(capped);

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const findings: ReconciliationFindingDto[] = [];
  for (const row of data ?? []) {
    if (!isRecord(row)) continue;
    const parsed = parseFinding(row);
    if (parsed) findings.push(parsed);
  }
  return { ok: true, findings };
}

export async function reviewReconciliationFinding(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    findingId: string;
    reviewerUserId: string;
    status: "accepted" | "rejected";
    note?: string | null;
  }
): Promise<
  | { ok: true; finding: ReconciliationFindingDto }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const findingId = input.findingId.trim();
  const reviewerUserId = input.reviewerUserId.trim();
  if (!tenantId || !findingId || !reviewerUserId) {
    return { ok: false, error: "required ids missing", code: "INVALID_INPUT" };
  }

  const reviewedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("tender_reconciliation_findings")
    .update({
      status: input.status,
      reviewed_by: reviewerUserId,
      reviewed_at: reviewedAt,
      review_note: input.note?.trim() ? input.note.trim().slice(0, 2000) : null,
      updated_at: reviewedAt,
    })
    .eq("id", findingId)
    .eq("tenant_id", tenantId)
    .in("status", ["open", "needs_review"])
    .select(
      "id, project_id, kind, status, title, summary, expected_quantity, observed_quantity, unit, source_document_ref, source_revision, estimate_ref, measurement_method, uncertainty, review_note, reviewed_by, reviewed_at, created_at"
    )
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "UPDATE_FAILED" };
  if (!data || !isRecord(data)) {
    return { ok: false, error: "Finding not found or already reviewed", code: "NOT_FOUND" };
  }
  const finding = parseFinding(data);
  if (!finding) return { ok: false, error: "malformed finding", code: "UPDATE_FAILED" };
  return { ok: true, finding };
}
