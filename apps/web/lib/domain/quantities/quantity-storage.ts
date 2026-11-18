import { createHash } from "node:crypto";
import {
  catalogueEntryFor,
  QUANTITY_RULE_VERSION,
  type QuantityCalculation,
  type QuantityRequest,
} from "./quantity-engine";

/** Stable JSON for hashing: sorted object keys, no whitespace variance. */
export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      out[key] = sortKeys(record[key]);
    }
    return out;
  }
  return value;
}

export function hashQuantityRequest(request: QuantityRequest): string {
  return createHash("sha256").update(canonicalizeJson(request), "utf8").digest("hex");
}

export type WorkSpecificationDraft = {
  work_code: string;
  title: string;
  rule_version?: string;
};

export type ResolvedWorkSpecification = {
  work_code: string;
  rule_version: string;
  unit: "m2" | "m" | "ea";
  quantity_basis: string;
  rule_id: string;
  title: string;
};

/**
 * Resolve a pilot WorkSpecification from catalogue metadata.
 * Prices and commercial rates are intentionally absent (A05 owns commercial bindings).
 */
export function resolvePilotWorkSpecification(
  draft: WorkSpecificationDraft
): { ok: true; data: ResolvedWorkSpecification } | { ok: false; error: string; code: string } {
  const workCode = typeof draft.work_code === "string" ? draft.work_code.trim() : "";
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  if (!workCode || workCode.length > 100) {
    return { ok: false, error: "work_code required", code: "INVALID_INPUT" };
  }
  if (!title || title.length > 200) {
    return { ok: false, error: "title required", code: "INVALID_INPUT" };
  }
  const ruleVersion =
    typeof draft.rule_version === "string" && draft.rule_version.trim()
      ? draft.rule_version.trim()
      : QUANTITY_RULE_VERSION;
  if (ruleVersion !== QUANTITY_RULE_VERSION) {
    return { ok: false, error: "unsupported rule_version", code: "UNSUPPORTED_RULE" };
  }
  const catalogue = catalogueEntryFor(workCode);
  if (!catalogue) {
    return { ok: false, error: "unsupported work_code", code: "UNSUPPORTED_RULE" };
  }
  return {
    ok: true,
    data: {
      work_code: workCode,
      rule_version: ruleVersion,
      unit: catalogue[0],
      quantity_basis: catalogue[1],
      rule_id: catalogue[2],
      title,
    },
  };
}

export type EvidenceRef = { kind: string; id: string };

export function normalizeEvidenceRefs(raw: unknown): EvidenceRef[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  const out: EvidenceRef[] = [];
  for (const item of raw.slice(0, 64)) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const kind = typeof record.kind === "string" ? record.kind.trim() : "";
    const id = typeof record.id === "string" ? record.id.trim() : "";
    if (!kind || kind.length > 40 || !id || id.length > 100) continue;
    out.push({ kind, id });
  }
  return out;
}

/** Public DTO for stored snapshots — never includes unit prices or margin. */
export type QuantityInputSnapshotDto = {
  id: string;
  tenant_id: string;
  project_id: string;
  work_specification_id: string | null;
  work_code: string;
  rule_version: string;
  quantity_kind: string;
  request_kind: string;
  request_hash: string;
  evidence_refs: EvidenceRef[];
  created_by: string | null;
  created_at: string;
};

export type QuantityCalculationRevisionDto = {
  id: string;
  tenant_id: string;
  project_id: string;
  input_snapshot_id: string;
  revision: number;
  quantity: string | null;
  unit: string | null;
  quantity_basis: string | null;
  rule_id: string | null;
  rule_version: string;
  issues: string[];
  created_by: string | null;
  created_at: string;
  result: QuantityCalculation;
};

const FORBIDDEN_COMMERCIAL_KEYS = new Set([
  "unit_price",
  "unit_cost",
  "unit_cost_minor",
  "total_price",
  "margin",
  "profitability",
  "cost",
  "costs",
  "markup",
  "subcontractor_cost",
  "internal_budget",
]);

/** Fail closed if a request payload smuggles commercial fields into A01 storage. */
export function assertNoCommercialFields(payload: unknown): string | null {
  return scanForbidden(payload, "");
}

function scanForbidden(value: unknown, path: string): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = scanForbidden(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (FORBIDDEN_COMMERCIAL_KEYS.has(lower)) {
        return `commercial field forbidden in quantity storage: ${path ? `${path}.` : ""}${key}`;
      }
      const hit = scanForbidden(child, path ? `${path}.${key}` : key);
      if (hit) return hit;
    }
  }
  return null;
}
