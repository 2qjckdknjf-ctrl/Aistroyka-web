import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseQuantityAcceptanceDecision,
  type QuantityAcceptanceDecision,
} from "./quantity-acceptance";

export type RecordQuantityAcceptanceInput = {
  tenantId: string;
  projectId: string;
  calculationRevisionId: string;
  actorUserId: string;
  decision: unknown;
  note?: string | null;
};

export type QuantityAcceptanceDto = {
  id: string;
  tenant_id: string;
  project_id: string;
  calculation_revision_id: string;
  decision: QuantityAcceptanceDecision;
  note: string | null;
  decided_by: string;
  decided_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function recordQuantityAcceptance(
  supabase: SupabaseClient,
  input: RecordQuantityAcceptanceInput
): Promise<
  | { ok: true; decision: QuantityAcceptanceDto }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const calculationRevisionId = input.calculationRevisionId.trim();
  const actorUserId = input.actorUserId.trim();
  const decision = parseQuantityAcceptanceDecision(input.decision);
  if (!tenantId || !projectId || !calculationRevisionId || !actorUserId || !decision) {
    return { ok: false, error: "invalid acceptance input", code: "INVALID_INPUT" };
  }

  const note =
    typeof input.note === "string" && input.note.trim()
      ? input.note.trim().slice(0, 2000)
      : null;

  const { data: calc, error: calcError } = await supabase
    .from("quantity_calculation_revisions")
    .select("id, tenant_id, project_id")
    .eq("id", calculationRevisionId)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (calcError) return { ok: false, error: calcError.message, code: "LOOKUP_FAILED" };
  if (!calc || !isRecord(calc)) {
    return { ok: false, error: "calculation revision not found", code: "NOT_FOUND" };
  }

  const { data, error } = await supabase
    .from("quantity_acceptance_decisions")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      calculation_revision_id: calculationRevisionId,
      decision,
      note,
      decided_by: actorUserId,
    })
    .select(
      "id, tenant_id, project_id, calculation_revision_id, decision, note, decided_by, decided_at"
    )
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "acceptance already recorded for this calculation revision",
        code: "CONFLICT",
      };
    }
    return { ok: false, error: error.message, code: "INSERT_FAILED" };
  }
  if (!data || !isRecord(data)) {
    return { ok: false, error: "insert returned no row", code: "INSERT_FAILED" };
  }

  const parsedDecision = parseQuantityAcceptanceDecision(data.decision);
  const id = asString(data.id);
  const decidedBy = asString(data.decided_by);
  const decidedAt = asString(data.decided_at);
  if (!id || !parsedDecision || !decidedBy || !decidedAt) {
    return { ok: false, error: "malformed acceptance row", code: "INSERT_FAILED" };
  }

  return {
    ok: true,
    decision: {
      id,
      tenant_id: tenantId,
      project_id: projectId,
      calculation_revision_id: calculationRevisionId,
      decision: parsedDecision,
      note: asString(data.note),
      decided_by: decidedBy,
      decided_at: decidedAt,
    },
  };
}
