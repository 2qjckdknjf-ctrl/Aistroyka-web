import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateQuantity,
  parseQuantityRequest,
  type QuantityRequest,
} from "./quantity-engine";
import {
  assertNoCommercialFields,
  hashQuantityRequest,
  normalizeEvidenceRefs,
  resolvePilotWorkSpecification,
  type EvidenceRef,
  type QuantityCalculationRevisionDto,
  type QuantityInputSnapshotDto,
  type ResolvedWorkSpecification,
} from "./quantity-storage";
import {
  getInputSnapshot,
  insertCalculationRevision,
  insertInputSnapshot,
  insertWorkSpecification,
  latestCalculationForSnapshot,
  listInputSnapshots,
  nextCalculationRevision,
  nextWorkSpecificationRevision,
} from "./quantity-storage.repository";

export type CreateQuantitySnapshotInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  request: unknown;
  evidenceRefs?: unknown;
  workSpecificationTitle?: string;
  compute?: boolean;
};

export type CreateQuantitySnapshotResult =
  | {
      ok: true;
      snapshot: QuantityInputSnapshotDto;
      created: boolean;
      work_specification_id: string | null;
      calculation: QuantityCalculationRevisionDto | null;
    }
  | { ok: false; error: string; code: string };

async function findInputSnapshotByHash(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  requestHash: string
): Promise<
  | { ok: true; snapshot: QuantityInputSnapshotDto | null }
  | { ok: false; error: string; code: string }
> {
  const { data, error } = await supabase
    .from("quantity_input_snapshots")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("request_hash", requestHash)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const id = typeof (data as { id?: unknown } | null)?.id === "string"
    ? (data as { id: string }).id
    : null;
  if (!id) return { ok: true, snapshot: null };
  return getInputSnapshot(supabase, tenantId, projectId, id);
}

async function ensureCalculation(
  supabase: SupabaseClient,
  args: {
    tenantId: string;
    projectId: string;
    actorUserId: string;
    snapshotId: string;
    request: QuantityRequest;
    reuseExisting: boolean;
  }
): Promise<
  | { ok: true; calculation: QuantityCalculationRevisionDto | null }
  | { ok: false; error: string; code: string }
> {
  if (args.reuseExisting) {
    const existing = await latestCalculationForSnapshot(
      supabase,
      args.tenantId,
      args.projectId,
      args.snapshotId
    );
    if (!existing.ok) return existing;
    if (existing.revision) return { ok: true, calculation: existing.revision };
  }

  const result = calculateQuantity(args.request);
  const nextRev = await nextCalculationRevision(
    supabase,
    args.tenantId,
    args.projectId,
    args.snapshotId
  );
  if (!nextRev.ok) return nextRev;

  const inserted = await insertCalculationRevision(supabase, {
    tenantId: args.tenantId,
    projectId: args.projectId,
    actorUserId: args.actorUserId,
    inputSnapshotId: args.snapshotId,
    revision: nextRev.revision,
    result,
  });
  if (inserted.ok) return { ok: true, calculation: inserted.revision };
  if (inserted.code !== "CONFLICT") return inserted;

  const again = await latestCalculationForSnapshot(
    supabase,
    args.tenantId,
    args.projectId,
    args.snapshotId
  );
  if (!again.ok) return again;
  return { ok: true, calculation: again.revision };
}

/**
 * Persist an immutable InputSnapshot + WorkSpecification (+ optional calculation).
 * Idempotent on request_hash. Never stores prices/margin (A05 owns commercial bindings).
 * Caller must enforce contractor manager rights and project membership.
 */
export async function persistQuantitySnapshot(
  supabase: SupabaseClient,
  input: CreateQuantitySnapshotInput
): Promise<CreateQuantitySnapshotResult> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const actorUserId = input.actorUserId.trim();
  if (!tenantId || !projectId || !actorUserId) {
    return {
      ok: false,
      error: "tenantId, projectId and actorUserId required",
      code: "INVALID_INPUT",
    };
  }

  const commercialHit = assertNoCommercialFields(input.request);
  if (commercialHit) {
    return { ok: false, error: commercialHit, code: "COMMERCIAL_FORBIDDEN" };
  }

  const parsed = parseQuantityRequest(input.request);
  if (!parsed.ok) {
    return { ok: false, error: "invalid quantity request", code: "INVALID_INPUT" };
  }
  const request = parsed.data;
  const evidenceRefs: EvidenceRef[] = normalizeEvidenceRefs(input.evidenceRefs);
  const title =
    typeof input.workSpecificationTitle === "string" && input.workSpecificationTitle.trim()
      ? input.workSpecificationTitle.trim()
      : request.work_code;

  const resolved = resolvePilotWorkSpecification({
    work_code: request.work_code,
    title,
    rule_version: request.rule_version,
  });
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, code: resolved.code };
  }
  const spec: ResolvedWorkSpecification = resolved.data;
  const compute = input.compute !== false;

  const existing = await findInputSnapshotByHash(
    supabase,
    tenantId,
    projectId,
    hashQuantityRequest(request)
  );
  if (!existing.ok) return existing;

  if (existing.snapshot) {
    let calculation: QuantityCalculationRevisionDto | null = null;
    if (compute) {
      const ensured = await ensureCalculation(supabase, {
        tenantId,
        projectId,
        actorUserId,
        snapshotId: existing.snapshot.id,
        request,
        reuseExisting: true,
      });
      if (!ensured.ok) return ensured;
      calculation = ensured.calculation;
    }
    return {
      ok: true,
      snapshot: existing.snapshot,
      created: false,
      work_specification_id: existing.snapshot.work_specification_id,
      calculation,
    };
  }

  const nextSpec = await nextWorkSpecificationRevision(
    supabase,
    tenantId,
    projectId,
    spec.work_code
  );
  if (!nextSpec.ok) return nextSpec;

  const specInsert = await insertWorkSpecification(supabase, {
    tenantId,
    projectId,
    actorUserId,
    revision: nextSpec.revision,
    spec,
  });
  if (!specInsert.ok) return specInsert;

  const snap = await insertInputSnapshot(supabase, {
    tenantId,
    projectId,
    actorUserId,
    workSpecificationId: specInsert.id,
    request,
    evidenceRefs,
  });
  if (!snap.ok) return snap;

  let calculation: QuantityCalculationRevisionDto | null = null;
  if (compute) {
    const ensured = await ensureCalculation(supabase, {
      tenantId,
      projectId,
      actorUserId,
      snapshotId: snap.snapshot.id,
      request,
      reuseExisting: !snap.created,
    });
    if (!ensured.ok) return ensured;
    calculation = ensured.calculation;
  }

  return {
    ok: true,
    snapshot: snap.snapshot,
    created: snap.created,
    work_specification_id: snap.snapshot.work_specification_id ?? specInsert.id,
    calculation,
  };
}

export async function listProjectQuantitySnapshots(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  limit?: number
) {
  return listInputSnapshots(supabase, tenantId, projectId, limit);
}

export async function getProjectQuantitySnapshot(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  snapshotId: string
): Promise<
  | {
      ok: true;
      snapshot: QuantityInputSnapshotDto;
      calculation: QuantityCalculationRevisionDto | null;
    }
  | { ok: false; error: string; code: string }
> {
  const snap = await getInputSnapshot(supabase, tenantId, projectId, snapshotId);
  if (!snap.ok) return snap;
  const calc = await latestCalculationForSnapshot(supabase, tenantId, projectId, snapshotId);
  if (!calc.ok) return calc;
  return { ok: true, snapshot: snap.snapshot, calculation: calc.revision };
}
