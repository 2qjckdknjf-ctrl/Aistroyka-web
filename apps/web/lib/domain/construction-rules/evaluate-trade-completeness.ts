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
  const priority = { conflicting: 3, unverified: 2, present: 1 };
  // A duplicate must never hide a declared conflict or unverified source.
  // Stable source ordering also makes the recorded result independent of input order.
  return inventory
    .filter((item) => item.evidenceKind === evidenceKind)
    .sort((a, b) => priority[b.status] - priority[a.status] ||
      (a.sourceRef?.trim() ?? "").localeCompare(b.sourceRef?.trim() ?? ""))[0];
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
  const conflictingCount = items.filter((i) => i.status === "conflicting").length;
  const missingRecommendedCount = items.filter(
    (i) => i.severity === "recommended" && (i.status === "missing" || i.status === "unverified")
  ).length;

  const questions = items
    .map((i) => i.question)
    .filter((q): q is string => typeof q === "string" && q.length > 0);

  let verdict: CompletenessVerdict;
  if (missingRequiredCount > 0) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else if (conflictingCount > 0) {
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
