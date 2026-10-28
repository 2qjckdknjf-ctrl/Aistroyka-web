import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuantityCalculation, QuantityRequest } from "./quantity-engine";
import {
  hashQuantityRequest,
  type EvidenceRef,
  type QuantityCalculationRevisionDto,
  type QuantityInputSnapshotDto,
  type ResolvedWorkSpecification,
} from "./quantity-storage";

type DbClient = SupabaseClient;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseEvidenceRefs(value: unknown): EvidenceRef[] {
  if (!Array.isArray(value)) return [];
  const out: EvidenceRef[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const kind = asString(item.kind);
    const id = asString(item.id);
    if (kind && id) out.push({ kind, id });
  }
  return out;
}

function parseSnapshotRow(row: Record<string, unknown>): QuantityInputSnapshotDto | null {
  const id = asString(row.id);
  const tenantId = asString(row.tenant_id);
  const projectId = asString(row.project_id);
  const workCode = asString(row.work_code);
  const ruleVersion = asString(row.rule_version);
  const quantityKind = asString(row.quantity_kind);
  const requestKind = asString(row.request_kind);
  const requestHash = asString(row.request_hash);
  const createdAt = asString(row.created_at);
  if (
    !id ||
    !tenantId ||
    !projectId ||
    !workCode ||
    !ruleVersion ||
    !quantityKind ||
    !requestKind ||
    !requestHash ||
    !createdAt
  ) {
    return null;
  }
  return {
    id,
    tenant_id: tenantId,
    project_id: projectId,
    work_specification_id: asString(row.work_specification_id),
    work_code: workCode,
    rule_version: ruleVersion,
    quantity_kind: quantityKind,
    request_kind: requestKind,
    request_hash: requestHash,
    evidence_refs: parseEvidenceRefs(row.evidence_refs),
    created_by: asString(row.created_by),
    created_at: createdAt,
  };
}

function parseCalculationRow(row: Record<string, unknown>): QuantityCalculationRevisionDto | null {
  const id = asString(row.id);
  const tenantId = asString(row.tenant_id);
  const projectId = asString(row.project_id);
  const snapshotId = asString(row.input_snapshot_id);
  const ruleVersion = asString(row.rule_version);
  const createdAt = asString(row.created_at);
  const revision = typeof row.revision === "number" ? row.revision : Number(row.revision);
  if (
    !id ||
    !tenantId ||
    !projectId ||
    !snapshotId ||
    !ruleVersion ||
    !createdAt ||
    !Number.isInteger(revision) ||
    revision < 1
  ) {
    return null;
  }
  const issues = Array.isArray(row.issues)
    ? row.issues.filter((item): item is string => typeof item === "string")
    : [];
  const payload = isRecord(row.result_payload) ? row.result_payload : null;
  const result: QuantityCalculation = {
    quantity: typeof payload?.quantity === "string" ? payload.quantity : asString(row.quantity),
    unit:
      payload?.unit === "m2" || payload?.unit === "m" || payload?.unit === "ea"
        ? payload.unit
        : row.unit === "m2" || row.unit === "m" || row.unit === "ea"
          ? row.unit
          : null,
    quantity_basis:
      typeof payload?.quantity_basis === "string"
        ? payload.quantity_basis
        : asString(row.quantity_basis),
    rule_id: typeof payload?.rule_id === "string" ? payload.rule_id : asString(row.rule_id),
    rule_version: ruleVersion as QuantityCalculation["rule_version"],
    issues: Array.isArray(payload?.issues)
      ? (payload.issues.filter((item): item is QuantityCalculation["issues"][number] =>
          typeof item === "string"
        ) as QuantityCalculation["issues"])
      : (issues as QuantityCalculation["issues"]),
    trace:
      payload?.trace && isRecord(payload.trace)
        ? (payload.trace as QuantityCalculation["trace"])
        : null,
  };
  return {
    id,
    tenant_id: tenantId,
    project_id: projectId,
    input_snapshot_id: snapshotId,
    revision,
    quantity: result.quantity,
    unit: result.unit,
    quantity_basis: result.quantity_basis,
    rule_id: result.rule_id,
    rule_version: ruleVersion,
    issues: result.issues,
    created_by: asString(row.created_by),
    created_at: createdAt,
    result,
  };
}

export type InsertWorkSpecificationInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  revision: number;
  spec: ResolvedWorkSpecification;
};

export async function insertWorkSpecification(
  supabase: DbClient,
  input: InsertWorkSpecificationInput
): Promise<{ ok: true; id: string } | { ok: false; error: string; code: string }> {
  const { data, error } = await supabase
    .from("quantity_work_specifications")
    .insert({
      tenant_id: input.tenantId,
      project_id: input.projectId,
      work_code: input.spec.work_code,
      rule_version: input.spec.rule_version,
      unit: input.spec.unit,
      quantity_basis: input.spec.quantity_basis,
      rule_id: input.spec.rule_id,
      title: input.spec.title,
      revision: input.revision,
      created_by: input.actorUserId,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "work specification revision already exists", code: "CONFLICT" };
    }
    return { ok: false, error: error.message, code: "INSERT_FAILED" };
  }
  const id = asString((data as { id?: unknown } | null)?.id);
  if (!id) return { ok: false, error: "insert returned no id", code: "INSERT_FAILED" };
  return { ok: true, id };
}

export async function nextWorkSpecificationRevision(
  supabase: DbClient,
  tenantId: string,
  projectId: string,
  workCode: string
): Promise<{ ok: true; revision: number } | { ok: false; error: string; code: string }> {
  const { data, error } = await supabase
    .from("quantity_work_specifications")
    .select("revision")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("work_code", workCode)
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const current = typeof (data as { revision?: unknown } | null)?.revision === "number"
    ? (data as { revision: number }).revision
    : 0;
  return { ok: true, revision: current + 1 };
}

export type InsertInputSnapshotInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  workSpecificationId: string | null;
  request: QuantityRequest;
  evidenceRefs: EvidenceRef[];
};

export async function insertInputSnapshot(
  supabase: DbClient,
  input: InsertInputSnapshotInput
): Promise<
  | { ok: true; snapshot: QuantityInputSnapshotDto; created: boolean }
  | { ok: false; error: string; code: string }
> {
  const requestHash = hashQuantityRequest(input.request);
  const existing = await supabase
    .from("quantity_input_snapshots")
    .select(
      "id, tenant_id, project_id, work_specification_id, work_code, rule_version, quantity_kind, request_kind, request_hash, evidence_refs, created_by, created_at"
    )
    .eq("tenant_id", input.tenantId)
    .eq("project_id", input.projectId)
    .eq("request_hash", requestHash)
    .maybeSingle();

  if (existing.error) {
    return { ok: false, error: existing.error.message, code: "LOOKUP_FAILED" };
  }
  if (existing.data && isRecord(existing.data)) {
    const parsed = parseSnapshotRow(existing.data);
    if (!parsed) return { ok: false, error: "malformed existing snapshot", code: "LOOKUP_FAILED" };
    return { ok: true, snapshot: parsed, created: false };
  }

  const { data, error } = await supabase
    .from("quantity_input_snapshots")
    .insert({
      tenant_id: input.tenantId,
      project_id: input.projectId,
      work_specification_id: input.workSpecificationId,
      work_code: input.request.work_code,
      rule_version: input.request.rule_version,
      quantity_kind: input.request.quantity_kind,
      request_kind: input.request.kind,
      request_payload: input.request,
      request_hash: requestHash,
      evidence_refs: input.evidenceRefs,
      created_by: input.actorUserId,
    })
    .select(
      "id, tenant_id, project_id, work_specification_id, work_code, rule_version, quantity_kind, request_kind, request_hash, evidence_refs, created_by, created_at"
    )
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const retry = await supabase
        .from("quantity_input_snapshots")
        .select(
          "id, tenant_id, project_id, work_specification_id, work_code, rule_version, quantity_kind, request_kind, request_hash, evidence_refs, created_by, created_at"
        )
        .eq("tenant_id", input.tenantId)
        .eq("project_id", input.projectId)
        .eq("request_hash", requestHash)
        .maybeSingle();
      if (retry.error || !retry.data || !isRecord(retry.data)) {
        return { ok: false, error: error.message, code: "CONFLICT" };
      }
      const parsed = parseSnapshotRow(retry.data);
      if (!parsed) return { ok: false, error: "malformed snapshot after conflict", code: "CONFLICT" };
      return { ok: true, snapshot: parsed, created: false };
    }
    return { ok: false, error: error.message, code: "INSERT_FAILED" };
  }
  if (!data || !isRecord(data)) {
    return { ok: false, error: "insert returned no row", code: "INSERT_FAILED" };
  }
  const parsed = parseSnapshotRow(data);
  if (!parsed) return { ok: false, error: "malformed inserted snapshot", code: "INSERT_FAILED" };
  return { ok: true, snapshot: parsed, created: true };
}

export type InsertCalculationRevisionInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  inputSnapshotId: string;
  revision: number;
  result: QuantityCalculation;
};

export async function insertCalculationRevision(
  supabase: DbClient,
  input: InsertCalculationRevisionInput
): Promise<
  | { ok: true; revision: QuantityCalculationRevisionDto }
  | { ok: false; error: string; code: string }
> {
  const { data, error } = await supabase
    .from("quantity_calculation_revisions")
    .insert({
      tenant_id: input.tenantId,
      project_id: input.projectId,
      input_snapshot_id: input.inputSnapshotId,
      revision: input.revision,
      result_payload: input.result,
      quantity: input.result.quantity,
      unit: input.result.unit,
      quantity_basis: input.result.quantity_basis,
      rule_id: input.result.rule_id,
      rule_version: input.result.rule_version,
      issues: input.result.issues,
      created_by: input.actorUserId,
    })
    .select(
      "id, tenant_id, project_id, input_snapshot_id, revision, result_payload, quantity, unit, quantity_basis, rule_id, rule_version, issues, created_by, created_at"
    )
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "calculation revision already exists", code: "CONFLICT" };
    }
    return { ok: false, error: error.message, code: "INSERT_FAILED" };
  }
  if (!data || !isRecord(data)) {
    return { ok: false, error: "insert returned no row", code: "INSERT_FAILED" };
  }
  const parsed = parseCalculationRow(data);
  if (!parsed) return { ok: false, error: "malformed calculation revision", code: "INSERT_FAILED" };
  return { ok: true, revision: parsed };
}

export async function nextCalculationRevision(
  supabase: DbClient,
  tenantId: string,
  projectId: string,
  inputSnapshotId: string
): Promise<{ ok: true; revision: number } | { ok: false; error: string; code: string }> {
  const { data, error } = await supabase
    .from("quantity_calculation_revisions")
    .select("revision")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("input_snapshot_id", inputSnapshotId)
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const current = typeof (data as { revision?: unknown } | null)?.revision === "number"
    ? (data as { revision: number }).revision
    : 0;
  return { ok: true, revision: current + 1 };
}

export async function listInputSnapshots(
  supabase: DbClient,
  tenantId: string,
  projectId: string,
  limit = 50
): Promise<
  | { ok: true; snapshots: QuantityInputSnapshotDto[] }
  | { ok: false; error: string; code: string }
> {
  const capped = Math.min(Math.max(limit, 1), 100);
  const { data, error } = await supabase
    .from("quantity_input_snapshots")
    .select(
      "id, tenant_id, project_id, work_specification_id, work_code, rule_version, quantity_kind, request_kind, request_hash, evidence_refs, created_by, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(capped);

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  if (!Array.isArray(data)) return { ok: false, error: "malformed list", code: "LOOKUP_FAILED" };
  const snapshots: QuantityInputSnapshotDto[] = [];
  for (const row of data) {
    if (!isRecord(row)) return { ok: false, error: "malformed snapshot row", code: "LOOKUP_FAILED" };
    const parsed = parseSnapshotRow(row);
    if (!parsed) return { ok: false, error: "malformed snapshot row", code: "LOOKUP_FAILED" };
    snapshots.push(parsed);
  }
  return { ok: true, snapshots };
}

export async function getInputSnapshot(
  supabase: DbClient,
  tenantId: string,
  projectId: string,
  snapshotId: string
): Promise<
  | { ok: true; snapshot: QuantityInputSnapshotDto }
  | { ok: false; error: string; code: string }
> {
  const { data, error } = await supabase
    .from("quantity_input_snapshots")
    .select(
      "id, tenant_id, project_id, work_specification_id, work_code, rule_version, quantity_kind, request_kind, request_hash, evidence_refs, created_by, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("id", snapshotId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  if (!data || !isRecord(data)) return { ok: false, error: "snapshot not found", code: "NOT_FOUND" };
  const parsed = parseSnapshotRow(data);
  if (!parsed) return { ok: false, error: "malformed snapshot", code: "LOOKUP_FAILED" };
  return { ok: true, snapshot: parsed };
}

export async function latestCalculationForSnapshot(
  supabase: DbClient,
  tenantId: string,
  projectId: string,
  snapshotId: string
): Promise<
  | { ok: true; revision: QuantityCalculationRevisionDto | null }
  | { ok: false; error: string; code: string }
> {
  const { data, error } = await supabase
    .from("quantity_calculation_revisions")
    .select(
      "id, tenant_id, project_id, input_snapshot_id, revision, result_payload, quantity, unit, quantity_basis, rule_id, rule_version, issues, created_by, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("input_snapshot_id", snapshotId)
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  if (!data) return { ok: true, revision: null };
  if (!isRecord(data)) return { ok: false, error: "malformed calculation", code: "LOOKUP_FAILED" };
  const parsed = parseCalculationRow(data);
  if (!parsed) return { ok: false, error: "malformed calculation", code: "LOOKUP_FAILED" };
  return { ok: true, revision: parsed };
}
