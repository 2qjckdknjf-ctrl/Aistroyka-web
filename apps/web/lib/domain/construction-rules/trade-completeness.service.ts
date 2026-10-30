import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateTradeCompleteness } from "./evaluate-trade-completeness";
import {
  getApprovedTradeCompletenessTemplates,
  getTradeCompletenessTemplateById,
} from "./waterproofing-completeness.template";
import type {
  CompletenessEvidenceKind,
  EvidenceInventoryItem,
  TradeCompletenessEvaluation,
} from "./trade-completeness.types";

const EVIDENCE_KINDS = new Set<CompletenessEvidenceKind>([
  "contract_scope",
  "work_specification",
  "measured_quantity",
  "calibrated_photo",
  "video_segment",
  "material_datasheet",
  "substrate_prep_record",
  "layer_thickness_record",
  "inspection_checklist",
  "signoff_document",
]);

function isEvidenceKind(value: string): value is CompletenessEvidenceKind {
  return EVIDENCE_KINDS.has(value as CompletenessEvidenceKind);
}

export function parseEvidenceInventory(raw: unknown): EvidenceInventoryItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: EvidenceInventoryItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const kindRaw =
      typeof record.evidence_kind === "string"
        ? record.evidence_kind
        : typeof record.evidenceKind === "string"
          ? record.evidenceKind
          : "";
    if (!isEvidenceKind(kindRaw)) continue;
    const statusRaw =
      typeof record.status === "string" ? record.status : "present";
    const status =
      statusRaw === "unverified" || statusRaw === "conflicting" || statusRaw === "present"
        ? statusRaw
        : null;
    if (!status) continue;
    const sourceRef =
      typeof record.source_ref === "string"
        ? record.source_ref
        : typeof record.sourceRef === "string"
          ? record.sourceRef
          : null;
    items.push({ evidenceKind: kindRaw, status, sourceRef });
  }
  return items;
}

export function listTradeCompletenessTemplates() {
  return getApprovedTradeCompletenessTemplates().map((t) => ({
    id: t.id,
    version: t.version,
    status: t.status,
    trade: t.trade,
    work_element_type: t.workElementType,
    source_document: t.sourceDocument,
    source_revision: t.sourceRevision,
    source_clause: t.sourceClause,
    effective_from: t.effectiveFrom,
    jurisdiction_note: t.jurisdictionNote,
    requirement_count: t.requirements.length,
  }));
}

export function runTradeCompletenessEvaluation(
  templateId: string,
  inventory: EvidenceInventoryItem[]
):
  | { ok: true; evaluation: TradeCompletenessEvaluation }
  | { ok: false; error: string; code: string } {
  const template = getTradeCompletenessTemplateById(templateId);
  if (!template) {
    return { ok: false, error: "Unknown or unapproved template", code: "TEMPLATE_NOT_FOUND" };
  }
  return { ok: true, evaluation: evaluateTradeCompleteness(template, inventory) };
}

export async function persistTradeCompletenessEvaluation(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    projectId: string;
    actorUserId: string;
    evaluation: TradeCompletenessEvaluation;
    inventory: EvidenceInventoryItem[];
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string; code: string }> {
  const { data, error } = await supabase
    .from("construction_completeness_evaluations")
    .insert({
      tenant_id: input.tenantId,
      project_id: input.projectId,
      template_id: input.evaluation.templateId,
      template_version: input.evaluation.templateVersion,
      trade: input.evaluation.trade,
      verdict: input.evaluation.verdict,
      missing_required_count: input.evaluation.missingRequiredCount,
      missing_recommended_count: input.evaluation.missingRecommendedCount,
      result_json: {
        items: input.evaluation.items,
        questions: input.evaluation.questions,
        inventory: input.inventory,
      },
      created_by: input.actorUserId,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, code: "PERSIST_FAILED" };
  }
  const id = typeof data?.id === "string" ? data.id : null;
  if (!id) {
    return { ok: false, error: "persist returned no id", code: "PERSIST_FAILED" };
  }
  return { ok: true, id };
}
