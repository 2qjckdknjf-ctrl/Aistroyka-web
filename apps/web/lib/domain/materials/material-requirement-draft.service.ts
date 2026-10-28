import type { SupabaseClient } from "@supabase/supabase-js";
import { materialRequirement } from "@/lib/domain/quantities/quantity-engine";
import {
  isQuantityCommerciallyBindable,
  parseQuantityAcceptanceDecision,
} from "@/lib/domain/quantities/quantity-acceptance";

export type CreateMaterialRequirementDraftInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  acceptanceDecisionId: string;
  workQuantity: string;
  consumption: string | null;
  waste: string | null;
  packCoverage: string | null;
};

export type AddSupplierQuoteDraftInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  materialRequirementDraftId: string;
  supplierName: string;
  sku: string | null;
  packageLabel: string | null;
  unitPriceMinor: string;
  coverageQuantity: string | null;
  region: string | null;
  shippingNote: string | null;
  stockStatus: "unknown" | "in_stock" | "out_of_stock" | "lead_time";
  leadTimeDays: number | null;
  quoteDatedAt: string;
  quoteExpiresAt: string | null;
  provenanceNote: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeOptionalDecimal(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Create a material-need draft from an accepted quantity decision.
 * Does not place orders, pay, or message suppliers.
 */
export async function createMaterialRequirementDraft(
  supabase: SupabaseClient,
  input: CreateMaterialRequirementDraftInput
): Promise<
  | {
      ok: true;
      draft: {
        id: string;
        acceptance_decision_id: string;
        work_quantity: string | null;
        material_need: string | null;
        pack_count: string | null;
        purchase_quantity: string | null;
        issues: string[];
      };
    }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const acceptanceDecisionId = input.acceptanceDecisionId.trim();
  const actorUserId = input.actorUserId.trim();
  const workQuantity = input.workQuantity.trim();
  if (!tenantId || !projectId || !acceptanceDecisionId || !actorUserId || !workQuantity) {
    return { ok: false, error: "required fields missing", code: "INVALID_INPUT" };
  }

  const { data: acceptance, error: acceptanceError } = await supabase
    .from("quantity_acceptance_decisions")
    .select("id, tenant_id, project_id, decision")
    .eq("id", acceptanceDecisionId)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (acceptanceError) {
    return { ok: false, error: acceptanceError.message, code: "LOOKUP_FAILED" };
  }
  if (!acceptance || !isRecord(acceptance)) {
    return { ok: false, error: "acceptance decision not found", code: "NOT_FOUND" };
  }
  const decision = parseQuantityAcceptanceDecision(acceptance.decision);
  // Reuse accepted-gate: only accepted physical quantities feed material drafts.
  if (!isQuantityCommerciallyBindable(decision)) {
    return {
      ok: false,
      error: "only accepted quantity decisions may create material drafts",
      code: "NOT_ACCEPTED",
    };
  }

  const calc = materialRequirement(
    workQuantity,
    normalizeOptionalDecimal(input.consumption),
    normalizeOptionalDecimal(input.waste),
    normalizeOptionalDecimal(input.packCoverage)
  );

  // Fatal calculator issues must not occupy the unique (tenant, project, acceptance) slot.
  // Missing optional params remain persistable as incomplete drafts.
  if (
    calc.issues.includes("invalid_input") ||
    calc.issues.includes("quantity_precision_loss") ||
    calc.issues.includes("quantity_out_of_range") ||
    calc.issues.includes("below_storage_resolution")
  ) {
    return {
      ok: false,
      error: "material requirement calculation rejected",
      code: "INVALID_INPUT",
    };
  }

  const { data, error } = await supabase
    .from("material_requirement_drafts")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      acceptance_decision_id: acceptanceDecisionId,
      work_quantity: calc.work_quantity ?? workQuantity,
      consumption: normalizeOptionalDecimal(input.consumption),
      waste: normalizeOptionalDecimal(input.waste),
      pack_coverage: normalizeOptionalDecimal(input.packCoverage),
      material_need: calc.material_need,
      pack_count: calc.pack_count,
      purchase_quantity: calc.purchase_quantity,
      issues: calc.issues,
      created_by: actorUserId,
    })
    .select(
      "id, acceptance_decision_id, work_quantity, material_need, pack_count, purchase_quantity, issues"
    )
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "material requirement draft already exists", code: "CONFLICT" };
    }
    return { ok: false, error: error.message, code: "INSERT_FAILED" };
  }
  if (!data || !isRecord(data)) {
    return { ok: false, error: "insert returned no row", code: "INSERT_FAILED" };
  }
  const id = asString(data.id);
  if (!id) return { ok: false, error: "insert returned no id", code: "INSERT_FAILED" };

  return {
    ok: true,
    draft: {
      id,
      acceptance_decision_id: acceptanceDecisionId,
      work_quantity: asString(data.work_quantity),
      material_need: asString(data.material_need),
      pack_count: asString(data.pack_count),
      purchase_quantity: asString(data.purchase_quantity),
      issues: Array.isArray(data.issues)
        ? data.issues.filter((item): item is string => typeof item === "string")
        : [...calc.issues],
    },
  };
}

/**
 * Attach a dated supplier quote draft for comparison. Defaults stock to unknown.
 * Never sends messages or creates purchase orders.
 */
export async function addMaterialSupplierQuoteDraft(
  supabase: SupabaseClient,
  input: AddSupplierQuoteDraftInput
): Promise<
  | { ok: true; quote: { id: string; stock_status: string; quote_dated_at: string } }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const draftId = input.materialRequirementDraftId.trim();
  const actorUserId = input.actorUserId.trim();
  const supplierName = input.supplierName.trim();
  const unitPriceMinor = input.unitPriceMinor.trim();
  const quoteDatedAt = input.quoteDatedAt.trim();
  if (!tenantId || !projectId || !draftId || !actorUserId || !supplierName || !unitPriceMinor || !quoteDatedAt) {
    return { ok: false, error: "required fields missing", code: "INVALID_INPUT" };
  }
  if (!/^(0|[1-9][0-9]*)$/.test(unitPriceMinor) || unitPriceMinor.length > 30) {
    return { ok: false, error: "invalid unit_price_minor", code: "INVALID_INPUT" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quoteDatedAt)) {
    return { ok: false, error: "invalid quote_dated_at", code: "INVALID_INPUT" };
  }
  const stockStatus = input.stockStatus || "unknown";
  if (
    stockStatus !== "unknown" &&
    stockStatus !== "in_stock" &&
    stockStatus !== "out_of_stock" &&
    stockStatus !== "lead_time"
  ) {
    return { ok: false, error: "invalid stock_status", code: "INVALID_INPUT" };
  }
  if (
    input.leadTimeDays !== null &&
    (!Number.isInteger(input.leadTimeDays) ||
      input.leadTimeDays < 0 ||
      input.leadTimeDays > 2147483647)
  ) {
    return { ok: false, error: "invalid lead_time_days", code: "INVALID_INPUT" };
  }

  const { data: parent, error: parentError } = await supabase
    .from("material_requirement_drafts")
    .select("id")
    .eq("id", draftId)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (parentError) return { ok: false, error: parentError.message, code: "LOOKUP_FAILED" };
  if (!parent) return { ok: false, error: "material requirement draft not found", code: "NOT_FOUND" };

  const { data, error } = await supabase
    .from("material_supplier_quote_drafts")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      material_requirement_draft_id: draftId,
      supplier_name: supplierName.slice(0, 200),
      sku: input.sku?.trim() ? input.sku.trim().slice(0, 100) : null,
      package_label: input.packageLabel?.trim() ? input.packageLabel.trim().slice(0, 200) : null,
      unit_price_minor: unitPriceMinor,
      currency: "EUR",
      coverage_quantity: normalizeOptionalDecimal(input.coverageQuantity),
      region: input.region?.trim() ? input.region.trim().slice(0, 100) : null,
      shipping_note: input.shippingNote?.trim() ? input.shippingNote.trim().slice(0, 500) : null,
      stock_status: stockStatus,
      lead_time_days: typeof input.leadTimeDays === "number" ? input.leadTimeDays : null,
      quote_dated_at: quoteDatedAt,
      quote_expires_at:
        typeof input.quoteExpiresAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.quoteExpiresAt.trim())
          ? input.quoteExpiresAt.trim()
          : null,
      provenance_note: input.provenanceNote?.trim()
        ? input.provenanceNote.trim().slice(0, 500)
        : null,
      created_by: actorUserId,
    })
    .select("id, stock_status, quote_dated_at")
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "INSERT_FAILED" };
  if (!data || !isRecord(data)) {
    return { ok: false, error: "insert returned no row", code: "INSERT_FAILED" };
  }
  const id = asString(data.id);
  if (!id) return { ok: false, error: "insert returned no id", code: "INSERT_FAILED" };

  return {
    ok: true,
    quote: {
      id,
      stock_status: asString(data.stock_status) ?? stockStatus,
      quote_dated_at: asString(data.quote_dated_at) ?? quoteDatedAt,
    },
  };
}
