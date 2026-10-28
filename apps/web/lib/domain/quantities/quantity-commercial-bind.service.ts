import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateCommercialLine } from "./commercial";
import {
  isQuantityCommerciallyBindable,
  parseQuantityAcceptanceDecision,
} from "./quantity-acceptance";

export type BindCommercialInput = {
  tenantId: string;
  projectId: string;
  actorUserId: string;
  acceptanceDecisionId: string;
  commercialInput: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Bind a commercial.stage2a.v1 calculation to an accepted quantity decision.
 * Fails closed unless A04 decision is accepted. Contractor-internal only.
 */
export async function bindAcceptedQuantityCommercial(
  supabase: SupabaseClient,
  input: BindCommercialInput
): Promise<
  | {
      ok: true;
      binding: {
        id: string;
        acceptance_decision_id: string;
        work_spec_hash: string;
        issues: string[];
        result: unknown;
      };
    }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const acceptanceDecisionId = input.acceptanceDecisionId.trim();
  const actorUserId = input.actorUserId.trim();
  if (!tenantId || !projectId || !acceptanceDecisionId || !actorUserId) {
    return { ok: false, error: "required ids missing", code: "INVALID_INPUT" };
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
  if (!isQuantityCommerciallyBindable(decision)) {
    return {
      ok: false,
      error: "only accepted quantity decisions may bind commercial lines",
      code: "NOT_ACCEPTED",
    };
  }

  const commercial = calculateCommercialLine(input.commercialInput);
  if (!commercial.ok) {
    return {
      ok: false,
      error: "commercial calculation rejected",
      code: "COMMERCIAL_INVALID",
    };
  }

  const hash = commercial.quantity_context.work_spec_hash;

  const { data, error } = await supabase
    .from("quantity_commercial_bindings")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      acceptance_decision_id: acceptanceDecisionId,
      work_spec_hash: hash.slice(0, 128),
      commercial_policy: "commercial.stage2a.v1",
      result_payload: commercial,
      issues: [],
      created_by: actorUserId,
    })
    .select("id, acceptance_decision_id, work_spec_hash, issues, result_payload")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "commercial binding already exists", code: "CONFLICT" };
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
    binding: {
      id,
      acceptance_decision_id: acceptanceDecisionId,
      work_spec_hash: asString(data.work_spec_hash) ?? hash,
      issues: Array.isArray(data.issues)
        ? data.issues.filter((item): item is string => typeof item === "string")
        : [],
      result: data.result_payload,
    },
  };
}
