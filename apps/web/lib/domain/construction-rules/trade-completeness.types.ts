/**
 * AIS-RULE-015 — trade completeness types (contractor-internal).
 * Missing evidence → question/ABSTAIN/INSUFFICIENT_EVIDENCE, never PASS.
 * Templates do not invent statutory thresholds; AI does not add work packages.
 */

export type CompletenessEvidenceKind =
  | "contract_scope"
  | "work_specification"
  | "measured_quantity"
  | "calibrated_photo"
  | "video_segment"
  | "material_datasheet"
  | "substrate_prep_record"
  | "layer_thickness_record"
  | "inspection_checklist"
  | "signoff_document";

export type CompletenessRequirementSeverity = "required" | "recommended";

export type CompletenessItemStatus = "present" | "missing" | "unverified" | "conflicting";

export type CompletenessVerdict =
  | "ABSTAIN"
  | "INSUFFICIENT_EVIDENCE"
  | "NEEDS_REVIEW"
  | "READY_FOR_HUMAN_REVIEW";

/** Never emit PASS from this slice — completeness is not workmanship certification. */

export type TradeCompletenessRequirement = {
  id: string;
  evidenceKind: CompletenessEvidenceKind;
  severity: CompletenessRequirementSeverity;
  label: string;
  questionWhenMissing: string;
};

export type TradeCompletenessTemplate = {
  id: string;
  version: string;
  status: "approved";
  trade: string;
  workElementType: string;
  jurisdictionNote: string;
  sourceDocument: string;
  sourceRevision: string;
  sourceClause: string | null;
  effectiveFrom: string;
  requirements: TradeCompletenessRequirement[];
};

export type EvidenceInventoryItem = {
  evidenceKind: CompletenessEvidenceKind;
  /** present = claimed available; unverified = claimed but not linked; conflicting = clash */
  status: Exclude<CompletenessItemStatus, "missing">;
  sourceRef?: string | null;
};

export type EvaluatedCompletenessItem = {
  requirementId: string;
  evidenceKind: CompletenessEvidenceKind;
  severity: CompletenessRequirementSeverity;
  label: string;
  status: CompletenessItemStatus;
  question: string | null;
  sourceRef: string | null;
};

export type TradeCompletenessEvaluation = {
  templateId: string;
  templateVersion: string;
  trade: string;
  verdict: CompletenessVerdict;
  items: EvaluatedCompletenessItem[];
  missingRequiredCount: number;
  missingRecommendedCount: number;
  questions: string[];
};
