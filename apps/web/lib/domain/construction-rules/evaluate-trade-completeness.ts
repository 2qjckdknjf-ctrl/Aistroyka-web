import type {
  CompletenessVerdict,
  EvidenceInventoryItem,
  EvaluatedCompletenessItem,
  TradeCompletenessEvaluation,
  TradeCompletenessTemplate,
} from "./trade-completeness.types";

function pickInventory(
  inventory: EvidenceInventoryItem[],
  evidenceKind: EvidenceInventoryItem["evidenceKind"]
): EvidenceInventoryItem | undefined {
  return inventory.find((item) => item.evidenceKind === evidenceKind);
}

/**
 * Deterministic completeness evaluation against one approved template.
 * Photos alone never yield PASS. Missing/unverified/conflicting required items
 * force ABSTAIN or INSUFFICIENT_EVIDENCE (or NEEDS_REVIEW when only conflicts).
 */
export function evaluateTradeCompleteness(
  template: TradeCompletenessTemplate,
  inventory: EvidenceInventoryItem[]
): TradeCompletenessEvaluation {
  const items: EvaluatedCompletenessItem[] = template.requirements.map((req) => {
    const found = pickInventory(inventory, req.evidenceKind);
    if (!found) {
      return {
        requirementId: req.id,
        evidenceKind: req.evidenceKind,
        severity: req.severity,
        label: req.label,
        status: "missing",
        question: req.questionWhenMissing,
        sourceRef: null,
      };
    }
    if (found.status === "conflicting") {
      return {
        requirementId: req.id,
        evidenceKind: req.evidenceKind,
        severity: req.severity,
        label: req.label,
        status: "conflicting",
        question: `Resolve conflicting evidence for: ${req.label}`,
        sourceRef: found.sourceRef?.trim() || null,
      };
    }
    if (found.status === "unverified") {
      return {
        requirementId: req.id,
        evidenceKind: req.evidenceKind,
        severity: req.severity,
        label: req.label,
        status: "unverified",
        question: `Verify source linkage for: ${req.label}`,
        sourceRef: found.sourceRef?.trim() || null,
      };
    }
    return {
      requirementId: req.id,
      evidenceKind: req.evidenceKind,
      severity: req.severity,
      label: req.label,
      status: "present",
      question: null,
      sourceRef: found.sourceRef?.trim() || null,
    };
  });

  const missingRequiredCount = items.filter(
    (i) => i.severity === "required" && (i.status === "missing" || i.status === "unverified")
  ).length;
  const conflictingRequiredCount = items.filter(
    (i) => i.severity === "required" && i.status === "conflicting"
  ).length;
  const missingRecommendedCount = items.filter(
    (i) => i.severity === "recommended" && (i.status === "missing" || i.status === "unverified")
  ).length;

  const questions = items
    .map((i) => i.question)
    .filter((q): q is string => typeof q === "string" && q.length > 0);

  let verdict: CompletenessVerdict;
  if (missingRequiredCount > 0) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else if (conflictingRequiredCount > 0) {
    verdict = "NEEDS_REVIEW";
  } else if (missingRecommendedCount > 0) {
    verdict = "ABSTAIN";
  } else {
    // All checklist items present — still not a workmanship/safety PASS.
    verdict = "READY_FOR_HUMAN_REVIEW";
  }

  return {
    templateId: template.id,
    templateVersion: template.version,
    trade: template.trade,
    verdict,
    items,
    missingRequiredCount,
    missingRecommendedCount,
    questions,
  };
}
