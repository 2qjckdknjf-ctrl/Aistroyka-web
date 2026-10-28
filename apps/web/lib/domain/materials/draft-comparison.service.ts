import type { SupabaseClient } from "@supabase/supabase-js";
import {
  compareSupplierOfferDrafts,
  type SupplierOfferForCompare,
} from "./draft-comparison.engine";

export type CreateDraftComparisonInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  materialRequirementDraftId: string;
  offerIds?: string[] | null;
  asOfDate?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toCommercialQuantity(value: string): string | null {
  const trimmed = value.trim();
  if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  return `${whole}.${frac.padEnd(6, "0").slice(0, 6)}`;
}

/**
 * Build and persist an immutable draft comparison for a material requirement.
 * Does not order, pay, or message suppliers.
 */
export async function createMaterialSupplyDraftComparison(
  supabase: SupabaseClient,
  input: CreateDraftComparisonInput
): Promise<
  | {
      ok: true;
      comparison: {
        id: string;
        material_requirement_draft_id: string;
        policy_version: string;
        result: unknown;
        issues: string[];
      };
    }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const draftId = input.materialRequirementDraftId.trim();
  const actorUserId = input.actorUserId.trim();
  if (!tenantId || !projectId || !draftId || !actorUserId) {
    return { ok: false, error: "required ids missing", code: "INVALID_INPUT" };
  }

  const { data: requirement, error: reqError } = await supabase
    .from("material_requirement_drafts")
    .select(
      "id, purchase_quantity, material_need, pack_coverage, work_quantity"
    )
    .eq("id", draftId)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (reqError) return { ok: false, error: reqError.message, code: "LOOKUP_FAILED" };
  if (!requirement || !isRecord(requirement)) {
    return { ok: false, error: "material requirement draft not found", code: "NOT_FOUND" };
  }

  const billableRaw =
    asString(requirement.purchase_quantity) ??
    asString(requirement.material_need) ??
    asString(requirement.work_quantity);
  const billableQuantity = billableRaw ? toCommercialQuantity(billableRaw) : null;
  if (!billableQuantity) {
    return { ok: false, error: "requirement has no billable quantity", code: "INVALID_INPUT" };
  }

  const requestedOfferIds = input.offerIds == null ? null : [...new Set(input.offerIds)];
  if (requestedOfferIds !== null && requestedOfferIds.length === 0) {
    return { ok: false, error: "offer_ids must contain at least one id", code: "INVALID_INPUT" };
  }

  let quoteQuery = supabase
    .from("material_supplier_quote_drafts")
    .select(
      "id, supplier_name, unit_price_minor, coverage_quantity, stock_status, quote_dated_at, quote_expires_at, provenance_note"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("material_requirement_draft_id", draftId);

  if (requestedOfferIds !== null) {
    quoteQuery = quoteQuery.in("id", requestedOfferIds);
  }

  const { data: quotes, error: quoteError } = await quoteQuery;
  if (quoteError) return { ok: false, error: quoteError.message, code: "LOOKUP_FAILED" };

  const offers: SupplierOfferForCompare[] = (Array.isArray(quotes) ? quotes : [])
    .filter(isRecord)
    .map((row) => ({
      id: asString(row.id) ?? "",
      supplier_name: asString(row.supplier_name) ?? "",
      unit_price_minor: asString(row.unit_price_minor) ?? "0",
      coverage_quantity: asString(row.coverage_quantity),
      stock_status: asString(row.stock_status) ?? "unknown",
      quote_dated_at: asString(row.quote_dated_at) ?? "",
      quote_expires_at: asString(row.quote_expires_at),
      provenance_note: asString(row.provenance_note),
    }))
    .filter((offer) => offer.id && offer.supplier_name);

  if (requestedOfferIds !== null) {
    const foundIds = new Set(offers.map((offer) => offer.id));
    if (requestedOfferIds.some((id) => !foundIds.has(id))) {
      return {
        ok: false,
        error: "one or more offer ids were not found for this draft",
        code: "NOT_FOUND",
      };
    }
  }

  if (offers.length < 2) {
    return {
      ok: false,
      error: "at least two supplier quote drafts are required",
      code: "NEED_OFFERS",
    };
  }

  const asOfDate =
    typeof input.asOfDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.asOfDate.trim())
      ? input.asOfDate.trim()
      : new Date().toISOString().slice(0, 10);

  const result = compareSupplierOfferDrafts({
    billableQuantity,
    defaultCoverage: asString(requirement.pack_coverage),
    offers,
    asOfDate,
  });

  const { data, error } = await supabase
    .from("material_supply_draft_comparisons")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      material_requirement_draft_id: draftId,
      policy_version: result.policy_version,
      offer_ids: offers.map((offer) => offer.id),
      result_payload: result,
      issues: result.issues,
      created_by: actorUserId,
    })
    .select("id, material_requirement_draft_id, policy_version, result_payload, issues")
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: "INSERT_FAILED" };
  if (!data || !isRecord(data)) {
    return { ok: false, error: "insert returned no row", code: "INSERT_FAILED" };
  }
  const id = asString(data.id);
  if (!id) return { ok: false, error: "insert returned no id", code: "INSERT_FAILED" };

  return {
    ok: true,
    comparison: {
      id,
      material_requirement_draft_id: draftId,
      policy_version: asString(data.policy_version) ?? result.policy_version,
      result: data.result_payload,
      issues: Array.isArray(data.issues)
        ? data.issues.filter((item): item is string => typeof item === "string")
        : result.issues,
    },
  };
}
