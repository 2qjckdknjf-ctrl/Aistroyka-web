/**
 * Actionable insights: schema and deterministic rules engine.
 * Converts intelligence metrics into 3–7 prioritized next steps.
 * Web-only. No AI/LLM usage.
 */

export type ActionPriority = "P0" | "P1" | "P2";

export type ActionOwner =
  | "Site Manager"
  | "QC Engineer"
  | "Project Manager";

export interface ActionItem {
  title: string;
  priority: ActionPriority;
  owner: ActionOwner;
  rationale: string;
  next_step: string;
}

/** All computed signals required by the rules engine */
export interface ActionableSignals {
  riskLevel: "low" | "medium" | "high";
  strategicRiskIndex: number;
  healthScore: number;
  healthClassification: "Healthy" | "Moderate" | "Unstable" | "Critical";
  delayProbabilityHigh: boolean;
  slowdownTrend: boolean;
  riskEscalating: boolean;
  regressionAnomaly: boolean;
  jumpAnomaly: boolean;
  logicalInconsistency: boolean;
  confidenceScore: number;
  stageInstability: boolean;
  unstableProgress: boolean;
  structuralHighRisk: boolean;
  hasOutlier: boolean;
}

const MAX_ACTIONS = 7;
const MIN_ACTIONS = 3;
const PRIORITY_ORDER: ActionPriority[] = ["P0", "P1", "P2"];

/**
 * Deterministic rules engine: map signals to 3–7 prioritized action items.
 * Rules are explicit; no LLM. Order: P0 first, then P1, then P2.
 */
export function computeActionItems(signals: ActionableSignals): ActionItem[] {
  const items: ActionItem[] = [];

  // --- P0: Critical health or delay ---
  // Rule: Health classification Critical → P0 for PM to address overall health
  if (signals.healthClassification === "Critical") {
    items.push({
      title: "Address critical construction health",
      priority: "P0",
      owner: "Project Manager",
      rationale: "Health score is in Critical range; multiple risk factors are elevated.",
      next_step: "Review strategic risk drivers and schedule; align with site and QC.",
    });
  }

  // Rule: High delay probability → P0/P1 for Site Manager to mitigate delay
  if (signals.delayProbabilityHigh) {
    items.push({
      title: "Mitigate delay probability",
      priority: signals.healthClassification === "Critical" ? "P0" : "P1",
      owner: "Site Manager",
      rationale: "Delay probability is high; velocity vs. history suggests schedule risk.",
      next_step: "Confirm progress and resource allocation; adjust sequence if needed.",
    });
  }

  // --- P1: Risk, anomalies, structural issues ---
  // Rule: Strategic risk Critical → P1 for PM (if not already P0 from health)
  if (
    signals.strategicRiskIndex >= 70 &&
    signals.healthClassification !== "Critical" &&
    !items.some((i) => i.title.includes("critical"))
  ) {
    items.push({
      title: "Reduce strategic risk exposure",
      priority: "P1",
      owner: "Project Manager",
      rationale: "Strategic risk index is in Critical band.",
      next_step: "Review active risk drivers and mitigation plans.",
    });
  }

  // Rule: Risk escalating (last 2 analyses) → P1 for QC
  if (signals.riskEscalating) {
    items.push({
      title: "Stabilize risk trajectory",
      priority: "P1",
      owner: "QC Engineer",
      rationale: "Risk level increased between last two analyses.",
      next_step: "Inspect recent changes and quality controls; document findings.",
    });
  }

  // Rule: Regression anomaly (completion dropped) → P1 for Site Manager
  if (signals.regressionAnomaly) {
    items.push({
      title: "Verify completion regression",
      priority: "P1",
      owner: "Site Manager",
      rationale: "Completion dropped significantly vs. previous analysis.",
      next_step: "Confirm scope and progress; re-run analysis if data was incorrect.",
    });
  }

  // Rule: Logical inconsistency (high completion + high risk) → P1 for QC
  if (signals.logicalInconsistency) {
    items.push({
      title: "Resolve completion vs. risk inconsistency",
      priority: "P1",
      owner: "QC Engineer",
      rationale: "Completion is high but risk is high; result may need validation.",
      next_step: "Cross-check with site conditions; consider re-analysis.",
    });
  }

  // Rule: Structural high risk (>50% of last N analyses high risk) → P1 for QC
  if (signals.structuralHighRisk) {
    items.push({
      title: "Reduce structural risk in recent analyses",
      priority: "P1",
      owner: "QC Engineer",
      rationale: "More than half of recent analyses show high risk.",
      next_step: "Review recurring issues and quality controls.",
    });
  }

  // Rule: Slowdown trend → P1 for Site Manager (if not already in from delay)
  if (signals.slowdownTrend && !signals.delayProbabilityHigh) {
    items.push({
      title: "Address progress slowdown",
      priority: "P1",
      owner: "Site Manager",
      rationale: "Recent velocity is below average; progress is slowing.",
      next_step: "Identify bottlenecks and resource gaps; adjust plan.",
    });
  }

  // --- P2: Stability, outliers, data quality ---
  // Rule: Jump anomaly (unrealistic completion jump) → P2 for Site Manager
  if (signals.jumpAnomaly) {
    items.push({
      title: "Verify sudden completion jump",
      priority: "P2",
      owner: "Site Manager",
      rationale: "Large completion increase in a short period; possible data or scope issue.",
      next_step: "Confirm scope and timeline; re-run analysis if needed.",
    });
  }

  // Rule: Stage instability (oscillating or non-linear stages) → P2 for PM
  if (signals.stageInstability) {
    items.push({
      title: "Clarify project stage consistency",
      priority: "P2",
      owner: "Project Manager",
      rationale: "Stage labels are oscillating or changing non-linearly across analyses.",
      next_step: "Align stage definitions and re-run analyses for consistency.",
    });
  }

  // Rule: Unstable progress (velocity variance high) → P2 for PM
  if (signals.unstableProgress) {
    items.push({
      title: "Investigate progress variance",
      priority: "P2",
      owner: "Project Manager",
      rationale: "Progress velocity varies strongly between intervals.",
      next_step: "Review timing and scope of each analysis; smooth reporting cadence.",
    });
  }

  // Rule: Outlier (completion or risk) → P2 for QC
  if (signals.hasOutlier) {
    items.push({
      title: "Review outlier analysis",
      priority: "P2",
      owner: "QC Engineer",
      rationale: "One or more analyses deviate strongly in completion or risk.",
      next_step: "Confirm outlier is real or re-run analysis for that point.",
    });
  }

  // Rule: Low confidence (<60) → P2 for Site Manager (data quality)
  if (signals.confidenceScore < 60) {
    items.push({
      title: "Improve analysis data quality",
      priority: "P2",
      owner: "Site Manager",
      rationale: "Governance confidence score is low; result may be unreliable.",
      next_step: "Upload additional images or re-run analysis to improve confidence.",
    });
  }

  // Rule: Unstable health (not Healthy/Moderate) but not yet Critical → ensure at least one PM action if many risks
  if (
    signals.healthClassification === "Unstable" &&
    !items.some((i) => i.owner === "Project Manager")
  ) {
    items.push({
      title: "Review project health and priorities",
      priority: "P2",
      owner: "Project Manager",
      rationale: "Health classification is Unstable.",
      next_step: "Review risk drivers and assign clear next steps.",
    });
  }

  // Deduplicate by title (keep first), then sort by priority (P0, P1, P2)
  const seen = new Set<string>();
  const deduped = items.filter((i) => {
    if (seen.has(i.title)) return false;
    seen.add(i.title);
    return true;
  });
  const sorted = deduped.sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  // Ensure 3–7 items: pad with generic P2 if fewer than MIN_ACTIONS
  const genericFallbacks: ActionItem[] = [
    {
      title: "Continue monitoring progress",
      priority: "P2",
      owner: "Site Manager",
      rationale: "Regular checks help detect changes early.",
      next_step: "Upload new images and run analysis on the next reporting cycle.",
    },
    {
      title: "Review intelligence dashboards",
      priority: "P2",
      owner: "Project Manager",
      rationale: "Staying aligned with risk and health metrics.",
      next_step: "Check Strategic Risk and Construction Health after each new analysis.",
    },
  ];
  let result = sorted.slice(0, MAX_ACTIONS);
  for (let i = 0; result.length < MIN_ACTIONS && i < genericFallbacks.length; i++) {
    if (!result.some((a) => a.title === genericFallbacks[i].title)) {
      result = [...result, genericFallbacks[i]];
    }
  }
  return result;
}
