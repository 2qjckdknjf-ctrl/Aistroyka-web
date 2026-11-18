import type { TradeCompletenessTemplate } from "./trade-completeness.types";

/**
 * AIS-RULE-015 — first bounded trade template: bathroom/wet-area waterproofing.
 * Source is an internal product checklist (not a statutory code claim).
 * Thresholds/jurisdiction remain human-owned; this only lists evidence needs.
 */
export const WATERPROOFING_COMPLETENESS_TEMPLATE_V1: TradeCompletenessTemplate = {
  id: "trade.waterproofing.wet_area",
  version: "1.0.0",
  status: "approved",
  trade: "waterproofing",
  workElementType: "wet_area_membrane",
  jurisdictionNote:
    "Project/contract specs and local statutory requirements must be verified by a qualified reviewer; this template does not certify code compliance.",
  sourceDocument: "aistroyka.internal.trade_completeness.waterproofing",
  sourceRevision: "2026-10-30",
  sourceClause: "wet_area_v1",
  effectiveFrom: "2026-10-30",
  requirements: [
    {
      id: "wp.contract_scope",
      evidenceKind: "contract_scope",
      severity: "required",
      label: "Contract or work-order scope covering wet-area waterproofing",
      questionWhenMissing: "Which contract/work-order revision authorizes waterproofing in this room?",
    },
    {
      id: "wp.work_spec",
      evidenceKind: "work_specification",
      severity: "required",
      label: "Work specification / method statement for membrane system",
      questionWhenMissing: "What approved specification/revision defines the membrane system and layers?",
    },
    {
      id: "wp.measured_qty",
      evidenceKind: "measured_quantity",
      severity: "required",
      label: "Measured area/linear quantity with units",
      questionWhenMissing: "What measured quantity (with units and source) is confirmed for this package?",
    },
    {
      id: "wp.substrate",
      evidenceKind: "substrate_prep_record",
      severity: "required",
      label: "Substrate preparation record before membrane",
      questionWhenMissing: "Is substrate prep documented (clean/dry/primed) with date and source?",
    },
    {
      id: "wp.thickness",
      evidenceKind: "layer_thickness_record",
      severity: "required",
      label: "Layer / coat thickness or coverage record",
      questionWhenMissing: "Where is the layer thickness/coverage recorded with measurement method?",
    },
    {
      id: "wp.photo",
      evidenceKind: "calibrated_photo",
      severity: "required",
      label: "Field photo of installed membrane (preferably calibrated/scale-linked)",
      questionWhenMissing: "Is there an authorized field photo of the installed membrane for this location?",
    },
    {
      id: "wp.material",
      evidenceKind: "material_datasheet",
      severity: "recommended",
      label: "Material datasheet / product identity for membrane used",
      questionWhenMissing: "Which product datasheet/revision matches the installed membrane?",
    },
    {
      id: "wp.inspection",
      evidenceKind: "inspection_checklist",
      severity: "recommended",
      label: "Inspection checklist before covering works",
      questionWhenMissing: "Has a pre-cover inspection checklist been completed for this wet area?",
    },
    {
      id: "wp.signoff",
      evidenceKind: "signoff_document",
      severity: "recommended",
      label: "Qualified reviewer sign-off document",
      questionWhenMissing: "Which qualified reviewer signed off, and on which document revision?",
    },
  ],
};

export function getApprovedTradeCompletenessTemplates(): TradeCompletenessTemplate[] {
  return [WATERPROOFING_COMPLETENESS_TEMPLATE_V1];
}

export function getTradeCompletenessTemplateById(
  templateId: string
): TradeCompletenessTemplate | null {
  const id = templateId.trim();
  return getApprovedTradeCompletenessTemplates().find((t) => t.id === id) ?? null;
}
