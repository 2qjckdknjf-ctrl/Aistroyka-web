import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertObservationPayloadSafe,
  extractHeuristicObservations,
  type HeuristicObservationDraft,
} from "./heuristic-extractor";
import { resolveIntakeDraftForExtraction } from "./intake-draft-binding";

export type PreprojectReviewStatus = "pending" | "accepted" | "rejected" | "edited";

export type PreprojectObservationDto = {
  id: string;
  run_id: string;
  kind: string;
  label: string;
  payload: Record<string, unknown>;
  uncertainty: string;
  source_coords: Record<string, unknown>;
  review_status: PreprojectReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

export type PreprojectRunDto = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  intake_draft_id: string | null;
  status: string;
  source_kind: string;
  source_ref: string | null;
  created_at: string;
  observations: PreprojectObservationDto[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseObservation(row: Record<string, unknown>): PreprojectObservationDto | null {
  const id = asString(row.id);
  const runId = asString(row.run_id);
  const kind = asString(row.kind);
  const label = asString(row.label);
  const uncertainty = asString(row.uncertainty);
  const reviewStatus = asString(row.review_status) as PreprojectReviewStatus | null;
  const createdAt = asString(row.created_at);
  if (!id || !runId || !kind || !label || !uncertainty || !reviewStatus || !createdAt) return null;
  return {
    id,
    run_id: runId,
    kind,
    label,
    payload: isRecord(row.payload) ? row.payload : {},
    uncertainty,
    source_coords: isRecord(row.source_coords) ? row.source_coords : {},
    review_status: reviewStatus,
    reviewed_by: asString(row.reviewed_by),
    reviewed_at: asString(row.reviewed_at),
    review_note: asString(row.review_note),
    created_at: createdAt,
  };
}

export function parsePreprojectReviewStatus(value: unknown): Exclude<PreprojectReviewStatus, "pending"> | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "accepted" || normalized === "rejected" || normalized === "edited") {
    return normalized;
  }
  return null;
}

export type CreateHeuristicExtractionInput = {
  tenantId: string;
  actorUserId: string;
  projectId?: string | null;
  intakeDraftId?: string | null;
  text: string;
};

async function loadRunWithObservations(
  supabase: SupabaseClient,
  tenantId: string,
  runRow: Record<string, unknown>
): Promise<{ ok: true; run: PreprojectRunDto } | { ok: false; error: string; code: string }> {
  const runId = asString(runRow.id);
  if (!runId) return { ok: false, error: "run missing id", code: "LOOKUP_FAILED" };
  const listed = await listObservationsForRun(supabase, tenantId, runId);
  if (!listed.ok) return listed;
  return {
    ok: true,
    run: {
      id: runId,
      tenant_id: tenantId,
      project_id: asString(runRow.project_id),
      intake_draft_id: asString(runRow.intake_draft_id),
      status: asString(runRow.status) ?? "pending_review",
      source_kind: asString(runRow.source_kind) ?? "text_heuristic",
      source_ref: asString(runRow.source_ref),
      created_at: asString(runRow.created_at) ?? new Date().toISOString(),
      observations: listed.observations,
    },
  };
}

export async function createHeuristicExtractionRun(
  supabase: SupabaseClient,
  input: CreateHeuristicExtractionInput
): Promise<
  | { ok: true; run: PreprojectRunDto; reused?: boolean }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const actorUserId = input.actorUserId.trim();
  if (!tenantId || !actorUserId) {
    return { ok: false, error: "tenantId and actorUserId required", code: "INVALID_INPUT" };
  }

  const intakeDraftId = input.intakeDraftId?.trim() || null;
  const projectId = input.projectId?.trim() || null;

  // AIS-CLIENT-005A: bind intake_draft_id to a real tenant draft (project match or unassigned).
  if (intakeDraftId) {
    if (!projectId) {
      return {
        ok: false,
        error: "projectId required when intakeDraftId is set",
        code: "INVALID_INPUT",
      };
    }
    const resolved = await resolveIntakeDraftForExtraction(supabase, {
      tenantId,
      projectId,
      intakeDraftId,
    });
    if (!resolved.ok) {
      return { ok: false, error: resolved.error, code: resolved.code };
    }
  }

  // AIS-CLIENT-005A: repeated confirmation for the same intake draft must not duplicate entities.
  if (intakeDraftId) {
    const { data: existing, error: existingError } = await supabase
      .from("preproject_extraction_runs")
      .select("id, tenant_id, project_id, intake_draft_id, status, source_kind, source_ref, created_at")
      .eq("tenant_id", tenantId)
      .eq("intake_draft_id", intakeDraftId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingError) {
      return { ok: false, error: existingError.message, code: "LOOKUP_FAILED" };
    }
    if (existing && isRecord(existing)) {
      const loaded = await loadRunWithObservations(supabase, tenantId, existing);
      if (!loaded.ok) return loaded;
      return { ok: true, run: loaded.run, reused: true };
    }
  }

  const drafts = extractHeuristicObservations(input.text);
  for (const draft of drafts) {
    const bad = assertObservationPayloadSafe(draft.payload);
    if (bad) return { ok: false, error: bad, code: "COMMERCIAL_FORBIDDEN" };
  }

  const { data: runRow, error: runError } = await supabase
    .from("preproject_extraction_runs")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      intake_draft_id: intakeDraftId,
      status: "pending_review",
      source_kind: "text_heuristic",
      source_ref: "text_heuristic.v1",
      provider_meta: { engine: "text_heuristic.v1", observation_count: drafts.length },
      created_by: actorUserId,
    })
    .select("id, tenant_id, project_id, intake_draft_id, status, source_kind, source_ref, created_at")
    .maybeSingle();

  if (runError || !runRow || !isRecord(runRow)) {
    // Concurrent create for same draft: race → unique violation → reuse winner.
    if (intakeDraftId && runError?.code === "23505") {
      const { data: raced } = await supabase
        .from("preproject_extraction_runs")
        .select("id, tenant_id, project_id, intake_draft_id, status, source_kind, source_ref, created_at")
        .eq("tenant_id", tenantId)
        .eq("intake_draft_id", intakeDraftId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (raced && isRecord(raced)) {
        const loaded = await loadRunWithObservations(supabase, tenantId, raced);
        if (!loaded.ok) return loaded;
        return { ok: true, run: loaded.run, reused: true };
      }
    }
    return { ok: false, error: runError?.message ?? "run insert failed", code: "INSERT_FAILED" };
  }

  const runId = asString(runRow.id);
  if (!runId) return { ok: false, error: "run insert returned no id", code: "INSERT_FAILED" };

  const observationRows = drafts.map((draft: HeuristicObservationDraft) => ({
    tenant_id: tenantId,
    run_id: runId,
    kind: draft.kind,
    label: draft.label,
    payload: draft.payload,
    uncertainty: draft.uncertainty,
    source_coords: draft.source_coords,
    review_status: "pending",
  }));

  const { data: obsData, error: obsError } = await supabase
    .from("preproject_observations")
    .insert(observationRows)
    .select(
      "id, run_id, kind, label, payload, uncertainty, source_coords, review_status, reviewed_by, reviewed_at, review_note, created_at"
    );

  if (obsError) {
    return { ok: false, error: obsError.message, code: "INSERT_FAILED" };
  }

  const observations: PreprojectObservationDto[] = [];
  for (const row of obsData ?? []) {
    if (!isRecord(row)) continue;
    const parsed = parseObservation(row);
    if (parsed) observations.push(parsed);
  }

  return {
    ok: true,
    run: {
      id: runId,
      tenant_id: tenantId,
      project_id: asString(runRow.project_id),
      intake_draft_id: asString(runRow.intake_draft_id),
      status: asString(runRow.status) ?? "pending_review",
      source_kind: asString(runRow.source_kind) ?? "text_heuristic",
      source_ref: asString(runRow.source_ref),
      created_at: asString(runRow.created_at) ?? new Date().toISOString(),
      observations,
    },
  };
}

export async function listExtractionRunsForProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  limit = 20
): Promise<{ ok: true; runs: PreprojectRunDto[] } | { ok: false; error: string; code: string }> {
  const capped = Math.min(Math.max(limit, 1), 50);
  const { data, error } = await supabase
    .from("preproject_extraction_runs")
    .select("id, tenant_id, project_id, intake_draft_id, status, source_kind, source_ref, created_at")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(capped);

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };

  const runs: PreprojectRunDto[] = [];
  for (const row of data ?? []) {
    if (!isRecord(row)) continue;
    const id = asString(row.id);
    if (!id) continue;
    const obs = await listObservationsForRun(supabase, tenantId, id);
    if (!obs.ok) return obs;
    runs.push({
      id,
      tenant_id: tenantId,
      project_id: asString(row.project_id),
      intake_draft_id: asString(row.intake_draft_id),
      status: asString(row.status) ?? "pending_review",
      source_kind: asString(row.source_kind) ?? "text_heuristic",
      source_ref: asString(row.source_ref),
      created_at: asString(row.created_at) ?? "",
      observations: obs.observations,
    });
  }
  return { ok: true, runs };
}

async function listObservationsForRun(
  supabase: SupabaseClient,
  tenantId: string,
  runId: string
): Promise<{ ok: true; observations: PreprojectObservationDto[] } | { ok: false; error: string; code: string }> {
  const { data, error } = await supabase
    .from("preproject_observations")
    .select(
      "id, run_id, kind, label, payload, uncertainty, source_coords, review_status, reviewed_by, reviewed_at, review_note, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const observations: PreprojectObservationDto[] = [];
  for (const row of data ?? []) {
    if (!isRecord(row)) continue;
    const parsed = parseObservation(row);
    if (parsed) observations.push(parsed);
  }
  return { ok: true, observations };
}

export type ReviewObservationInput = {
  tenantId: string;
  observationId: string;
  reviewerUserId: string;
  status: Exclude<PreprojectReviewStatus, "pending">;
  note?: string | null;
  editedLabel?: string | null;
};

export async function reviewPreprojectObservation(
  supabase: SupabaseClient,
  input: ReviewObservationInput
): Promise<
  | { ok: true; observation: PreprojectObservationDto }
  | { ok: false; error: string; code: string }
> {
  const observationId = input.observationId.trim();
  const tenantId = input.tenantId.trim();
  const reviewerUserId = input.reviewerUserId.trim();
  if (!observationId || !tenantId || !reviewerUserId) {
    return { ok: false, error: "observationId, tenantId and reviewerUserId required", code: "INVALID_INPUT" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("preproject_observations")
    .select(
      "id, tenant_id, run_id, kind, label, payload, uncertainty, source_coords, review_status, reviewed_by, reviewed_at, review_note, created_at"
    )
    .eq("id", observationId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message, code: "LOOKUP_FAILED" };
  if (!existing || !isRecord(existing)) {
    return { ok: false, error: "Observation not found", code: "NOT_FOUND" };
  }

  const reviewedAt = new Date().toISOString();
  const note =
    typeof input.note === "string" && input.note.trim()
      ? input.note.trim().slice(0, 2000)
      : null;
  const label =
    input.status === "edited" && typeof input.editedLabel === "string" && input.editedLabel.trim()
      ? input.editedLabel.trim().slice(0, 200)
      : asString(existing.label);

  if (input.status === "edited" && (!label || label.length < 1)) {
    return { ok: false, error: "editedLabel required when status=edited", code: "INVALID_INPUT" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("preproject_observations")
    .update({
      review_status: input.status,
      reviewed_by: reviewerUserId,
      reviewed_at: reviewedAt,
      review_note: note,
      label,
      updated_at: reviewedAt,
    })
    .eq("id", observationId)
    .eq("tenant_id", tenantId)
    .select(
      "id, run_id, kind, label, payload, uncertainty, source_coords, review_status, reviewed_by, reviewed_at, review_note, created_at"
    )
    .maybeSingle();

  if (updateError || !updated || !isRecord(updated)) {
    return { ok: false, error: updateError?.message ?? "update failed", code: "UPDATE_FAILED" };
  }

  const parsed = parseObservation(updated);
  if (!parsed) return { ok: false, error: "malformed observation after update", code: "UPDATE_FAILED" };

  // Refresh run status from observation aggregate (best-effort).
  const runId = parsed.run_id;
  const listed = await listObservationsForRun(supabase, tenantId, runId);
  if (listed.ok) {
    const statuses = listed.observations.map((o) => o.review_status);
    const allDone = statuses.every((s) => s !== "pending");
    const anyDone = statuses.some((s) => s !== "pending");
    const nextStatus = allDone ? "reviewed" : anyDone ? "partially_reviewed" : "pending_review";
    await supabase
      .from("preproject_extraction_runs")
      .update({ status: nextStatus, updated_at: reviewedAt })
      .eq("id", runId)
      .eq("tenant_id", tenantId);
  }

  return { ok: true, observation: parsed };
}
